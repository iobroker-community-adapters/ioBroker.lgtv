/*
 * ioBroker LG WebOS SmartTV adapter
 *
 * Copyright (c) 2016-2026 Sebastian Schultz <mail@sebastian-schultz.de>,
 *                         iobroker-community-adapters <iobroker-community-adapters@gmx.de>
 *
 * MIT License
 */
import * as utils from '@iobroker/adapter-core';
import { existsSync, mkdirSync, readFile, writeFile } from 'node:fs';
import { join } from 'node:path';
import { wake } from 'wol';

import { probeTcpReachable } from './lib/probe';
import type {
    CommandCallback,
    CommandPayload,
    CreateAlertResponse,
    CurrentChannelResponse,
    ExternalInput,
    ExternalInputListResponse,
    ForegroundAppResponse,
    LaunchPoint,
    LaunchPointsResponse,
    RawCommand,
    SoundOutputResponse,
    SsapResponse,
    SwInformationResponse,
    SystemInfoResponse,
    SystemSettingsResponse,
    VolumeResponse,
} from './lib/types';
// lgtv2 v2 is an ESM-only package. This build is CommonJS (the compact-mode export at the
// bottom needs `module.exports`), so the value is pulled in with a dynamic `import()` in
// `connect()` and only the type is imported statically — see REFACTORING.md section 6.4.
import type { LGTV as LgTvClient } from 'lgtv2' with { 'resolution-mode': 'import' };

// Picture settings — write goes through createAlert with the alert immediately
// closed (the TV applies the luna setting via the onclose handler). Read goes
// through ssap://settings/getSystemSettings, one subscription per key, so a
// single unsupported property does not silently kill the whole subscription.
const PICTURE_KEYS = new Set([
    'pictureMode',
    'brightness',
    'backlight',
    'contrast',
    'color',
    'colorTemperature',
    'energySaving',
    'eyeComfortMode',
    'justScan',
]);
const PICTURE_NUMERIC_KEYS = new Set(['brightness', 'backlight', 'contrast', 'color', 'colorTemperature']);
// eyeComfortMode is the only picture setting with just two values, so the
// public state surface is `boolean` (true/false) for ergonomic scripting —
// users no longer have to write `'on'`/`'off'` strings. The Luna API still
// expects the lowercase strings, so we map at the boundary on both sides:
// boolean ⇄ 'on'/'off' in setPictureSetting / coercePictureValue.
const PICTURE_BOOLEAN_KEYS = new Set(['eyeComfortMode']);

const WATCHDOG_CHECK_MS = 30000;
const WATCHDOG_STUCK_MS = 60000;
const WATCHDOG_PROBE_PORT = 3001;
const WATCHDOG_PROBE_TIMEOUT_MS = 2000;

/** Remote button names that are not simply the uppercased state name */
const REMOTE_KEY_MAP: Record<string, string> = {
    '3dmode': '3D_MODE',
    livezoom: 'LIVE_ZOOM',
    aspectratio: 'ASPECT_RATIO',
};

/**
 * Picture writes go through the generic "picture" category; justScan is the
 * one exception — it accepts writes via the dedicated "aspectRatio" category.
 * All reads go through "picture"; webOS authorisation blocks reads of
 * pictureMode/colorTemperature/eyeComfortMode/justScan from there as well, so
 * those four properties end up effectively write-only on the public API.
 */
function setCategoryFor(key: string): string {
    return key === 'justScan' ? 'aspectRatio' : 'picture';
}

/**
 * Map the boolean public state to the Luna-expected on/off string. Tolerates
 * users who still write 'on'/'off' from existing scripts.
 */
function pictureBoolToLuna(raw: unknown): string | null {
    if (typeof raw === 'boolean') {
        return raw ? 'on' : 'off';
    }
    if (typeof raw === 'string') {
        const t = raw.trim().toLowerCase();
        if (t === 'on' || t === 'true' || t === '1') {
            return 'on';
        }
        if (t === 'off' || t === 'false' || t === '0') {
            return 'off';
        }
    }
    return null;
}

function coercePictureValue(key: string, raw: unknown): string | number | boolean | null {
    if (PICTURE_NUMERIC_KEYS.has(key)) {
        const n = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(n) ? n : null;
    }
    if (PICTURE_BOOLEAN_KEYS.has(key)) {
        // TV reports `'on'` / `'off'` — surface as boolean for the state.
        if (typeof raw === 'string') {
            const t = raw.trim().toLowerCase();
            if (t === 'on') {
                return true;
            }
            if (t === 'off') {
                return false;
            }
        }
        if (typeof raw === 'boolean') {
            return raw;
        }
        return null;
    }
    return typeof raw === 'string' ? raw : String(raw);
}

function launchList(arr: LaunchPoint[]): Record<string, string> {
    const obj: Record<string, string> = { livetv: 'Live TV' };
    arr.forEach(o => {
        obj[o.id] = o.title;
    });
    return obj;
}

function inputList(arr: ExternalInput[]): Record<string, string> {
    const obj: Record<string, string> = {};
    arr.forEach(o => {
        obj[o.id] = `${o.label} (${o.id})`;
    });
    return obj;
}

class LgTv extends utils.Adapter {
    private lgtv: LgTvClient | null = null;
    private hostUrl = '';
    private isConnect = false;
    private clientKey: string | undefined = undefined;
    private volume = 0;
    private oldVolume = 0;
    private keyFile = 'lgtvkeyfile';
    private curApp = '';
    private renewTimeout: ioBroker.Timeout | undefined = undefined;
    /**
     * Handle of the health poll, or `false` when polling was switched off.
     * The tri-state is intentional and comes from the JavaScript original:
     * `false` means "the TV reports its state reliably, do not poll again",
     * which is different from "no timer running right now" (`undefined`).
     */
    private healthInterval: ioBroker.Interval | undefined | false = undefined;

    // Reconnect watchdog (last resort). It was written for lgtv2 v1, whose
    // `websocket@1` transport could get stuck during the connection handshake
    // (TCP open, no upgrade response, no `connectFailed` event) and then never
    // schedule another retry. lgtv2 v2 handles that case itself: `handshakeTimeout`
    // fails the attempt after 10 seconds and its own reconnection fires ~5 seconds later, so a
    // `connecting` event arrives well before WATCHDOG_STUCK_MS is reached.
    // The watchdog is kept as a generic net for any other state that leaves the
    // adapter disconnected without further connect attempts: it observes how long
    // ago the library last emitted a `connecting` event and forces a fresh LGTV
    // instance once the gap exceeds the threshold. To avoid noisy warnings while
    // the TV is simply powered off, the re-creation is gated behind a quick TCP probe
    // of the WebSocket port.
    private lastConnectingAt = 0;
    private watchdogTimer: ioBroker.Interval | undefined = undefined;
    private watchdogProbeInFlight = false;

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({ ...options, systemConfig: true, name: 'lgtv' });

        this.on('ready', () => this.onReady());
        this.on('stateChange', (id, state) => this.onStateChange(id, state));
        this.on('unload', callback => this.onUnload(callback));
    }

    private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        if (!id || !state || state.ack) {
            return;
        }
        if (state.val === undefined || state.val === null) {
            return;
        }
        id = id.substring(this.namespace.length + 1);

        let vals: string[] | undefined;
        let dx: number | undefined;
        let dy: number | undefined;
        if (state.val.toString().includes(',')) {
            vals = state.val.toString().split(',');
            dx = parseInt(vals[0]);
            dy = parseInt(vals[1]);
        }
        this.log.debug(`State change "${id}" - VALUE: ${state.val as string}`);

        if (id.startsWith('states.picture.')) {
            const key = id.substring('states.picture.'.length);
            if (PICTURE_KEYS.has(key)) {
                this.setPictureSetting(key, state.val);
            }
            return;
        }

        switch (id) {
            case 'states.popup':
                this.log.debug(`Sending popup message "${state.val as string}" to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://system.notifications/createToast', { message: state.val }, err => {
                    if (!err) {
                        void this.setState('states.popup', state.val, true);
                    }
                });
                break;

            case 'states.turnOff':
                this.log.debug(`Sending turn OFF command to WebOS TV: ${this.config.ip}`);
                this.switchOff('states.turnOff', state.val);
                break;

            case 'states.power':
                if (!state.val) {
                    this.log.debug(`Sending turn OFF command to WebOS TV: ${this.config.ip}`);
                    this.switchOff('states.power', state.val);
                } else {
                    this.wakeTv();
                }
                break;

            case 'states.mute':
                this.log.debug(`Sending mute ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://audio/setMute', { mute: state.val }, err => {
                    if (!err) {
                        void this.setState('states.mute', state.val, true);
                    }
                });
                break;

            case 'states.volume':
                this.log.debug(`Sending volume change ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.oldVolume = this.volume;
                this.setVolume(Number(state.val));
                break;

            case 'states.volumeUp':
                this.log.debug(`Sending volumeUp ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://audio/volumeUp', null, err => {
                    if (!err) {
                        void this.setState('states.volumeUp', !!state.val, true);
                    }
                });
                break;

            case 'states.volumeDown':
                this.log.debug(`Sending volumeDown ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://audio/volumeDown', null, err => {
                    if (!err) {
                        void this.setState('states.volumeDown', !!state.val, true);
                    }
                });
                break;

            case 'states.channel':
                this.log.debug(
                    `Sending switch to channel ${state.val as string} command to WebOS TV: ${this.config.ip}`,
                );
                this.sendCommand('ssap://tv/openChannel', { channelNumber: state.val.toString() }, err => {
                    if (!err) {
                        void this.setState('states.channel', state.val, true);
                    } else {
                        this.log.debug(`Error in switching to channel: ${err}`);
                    }
                });
                break;

            case 'states.channelUp':
                this.log.debug(`Sending channelUp ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://tv/channelUp', null, err => {
                    if (!err) {
                        void this.setState('states.channelUp', !!state.val, true);
                    }
                });
                break;

            case 'states.channelDown':
                this.log.debug(`Sending channelDown ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://tv/channelDown', null, err => {
                    if (!err) {
                        void this.setState('states.channelDown', !!state.val, true);
                    }
                });
                break;

            case 'states.mediaPlay':
                this.log.debug(`Sending mediaPlay ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://media.controls/play', null, err => {
                    if (!err) {
                        void this.setState('states.mediaPlay', !!state.val, true);
                    }
                });
                break;

            case 'states.mediaPause':
                this.log.debug(`Sending mediaPause ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://media.controls/pause', null, err => {
                    if (!err) {
                        void this.setState('states.mediaPause', !!state.val, true);
                    }
                });
                break;

            case 'states.openURL':
                if (!state.val) {
                    void this.setState('states.openURL', '', true);
                    return;
                }
                this.log.debug(`Sending open ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://system.launcher/open', { target: state.val }, err => {
                    if (!err) {
                        void this.setState('states.openURL', state.val, true);
                    }
                });
                break;

            case 'states.mediaStop':
                this.log.debug(`Sending mediaStop ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://media.controls/stop', null, err => {
                    if (!err) {
                        void this.setState('states.mediaStop', !!state.val, true);
                    }
                });
                break;

            case 'states.mediaFastForward':
                this.log.debug(
                    `Sending mediaFastForward ${state.val as string} command to WebOS TV: ${this.config.ip}`,
                );
                this.sendCommand('ssap://media.controls/fastForward', null, err => {
                    if (!err) {
                        void this.setState('states.mediaFastForward', !!state.val, true);
                    }
                });
                break;

            case 'states.mediaRewind':
                this.log.debug(`Sending mediaRewind ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                this.sendCommand('ssap://media.controls/rewind', null, err => {
                    if (!err) {
                        void this.setState('states.mediaRewind', !!state.val, true);
                    }
                });
                break;

            case 'states.3Dmode':
                this.log.debug(`Sending 3Dmode ${state.val as string} command to WebOS TV: ${this.config.ip}`);
                // Kept as a strict true/false check: any other value is ignored, exactly as before.
                if (state.val === true) {
                    this.sendCommand('ssap://com.webos.service.tv.display/set3DOn', null, err => {
                        if (!err) {
                            void this.setState('states.3Dmode', !!state.val, true);
                        }
                    });
                } else if (state.val === false) {
                    this.sendCommand('ssap://com.webos.service.tv.display/set3DOff', null, err => {
                        if (!err) {
                            void this.setState('states.3Dmode', !!state.val, true);
                        }
                    });
                }
                break;

            case 'states.launch':
                this.log.debug(`Sending launch command ${state.val as string} to WebOS TV: ${this.config.ip}`);
                this.launchApp(state.val);
                break;

            case 'states.input':
                this.log.debug(
                    `Sending switch to input "${state.val as string}" command to WebOS TV: ${this.config.ip}`,
                );
                this.sendCommand('ssap://tv/switchInput', { inputId: state.val }, (err, val) => {
                    if (!err && val?.returnValue) {
                        void this.setState('states.input', state.val, true);
                    }
                });
                break;

            case 'states.raw':
                this.log.debug(`Sending RAW command api "${state.val as string}" to WebOS TV: ${this.config.ip}`);
                try {
                    const obj = JSON.parse(String(state.val)) as RawCommand;
                    this.sendCommand(obj.url, obj.cmd ?? null, (err, val) => {
                        if (!err) {
                            this.log.debug(`Response RAW  command api ${JSON.stringify(val)}`);
                            const rawResult = val !== undefined ? JSON.stringify(val) : '';
                            void this.setState('states.raw', rawResult, true);
                        }
                    });
                } catch (e) {
                    this.log.error(`Parse error RAW command api - ${e as string}`);
                }
                break;

            case 'states.youtube': {
                let uri = String(state.val);
                if (!uri) {
                    void this.setState('states.youtube', '', true);
                    return;
                }
                if (!~uri.indexOf('http')) {
                    uri = `https://www.youtube.com/watch?v=${uri}`;
                }
                this.sendCommand(
                    'ssap://system.launcher/launch',
                    { id: 'youtube.leanback.v4', contentId: uri },
                    err => {
                        if (!err) {
                            void this.setState('states.youtube', state.val, true);
                        }
                    },
                );
                break;
            }

            case 'states.drag':
                // The event type is 'move' for both moves and drags.
                if (dx && dy) {
                    this.sendCommand('move', { dx, dy, drag: vals?.[2] === 'drag' ? 1 : 0 }, err => {
                        if (!err) {
                            void this.setState(id, state.val, true);
                        }
                    });
                }
                break;

            case 'states.scroll':
                if (dx && dy) {
                    this.sendCommand('scroll', { dx, dy }, err => {
                        if (!err) {
                            void this.setState(id, state.val, true);
                        }
                    });
                }
                break;

            case 'states.click':
                this.sendCommand('click', {}, err => {
                    if (!err) {
                        void this.setState(id, state.val, true);
                    }
                });
                break;

            case 'states.soundOutput':
                this.sendCommand(
                    'ssap://com.webos.service.apiadapter/audio/changeSoundOutput',
                    { output: state.val },
                    err => {
                        if (!err) {
                            void this.setState(id, state.val, true);
                        }
                    },
                );
                break;

            default:
                if (~id.indexOf('remote')) {
                    this.handleRemoteKey(id, state);
                }
                break;
        }
    }

    /** Switch the TV off, acknowledging `ackId` when the TV confirmed */
    private switchOff(ackId: string, val: ioBroker.StateValue): void {
        if (this.config.power) {
            this.sendCommand('button', { name: 'power' }, err => {
                if (!err) {
                    void this.setState(ackId, val, true);
                }
            });
            return;
        }
        this.getState(`${this.namespace}.states.on`, (err, tvOn) => {
            if (err) {
                this.log.debug(`Error getting "on" state ${err}`);
                return;
            }
            if (!tvOn?.val) {
                this.log.debug('TV is already off');
                void this.setState(ackId, val, true);
                return;
            }
            this.sendCommand('ssap://system/turnOff', null, (offErr, res) => {
                if (!offErr && res?.returnValue === true) {
                    void this.setState(ackId, val, true);
                    void this.setState('states.on', false, true);
                }
            });
        });
    }

    private launchApp(val: ioBroker.StateValue): void {
        /** app id per known shortcut; everything else is passed through unchanged */
        const KNOWN_APPS: Record<string, { id: string; label: string }> = {
            livetv: { id: 'com.webos.app.livetv', label: 'LiveTV' },
            smartshare: { id: 'com.webos.app.smartshare', label: 'SmartShare App' },
            tvuserguide: { id: 'com.webos.app.tvuserguide', label: 'TV Userguide App' },
            netflix: { id: 'netflix', label: 'Netflix App' },
            youtube: { id: 'youtube.leanback.v4', label: 'Youtube App' },
            prime: { id: 'lovefilm.de', label: 'Amazon Prime App' },
            amazon: { id: 'amazon', label: 'Amazon Prime App' },
        };
        const known = typeof val === 'string' ? KNOWN_APPS[val] : undefined;
        if (known) {
            this.log.debug(`Switching to ${known.label} on WebOS TV: ${this.config.ip}`);
            this.sendCommand('ssap://system.launcher/launch', { id: known.id }, err => {
                if (!err) {
                    void this.setState('states.launch', val, true);
                }
            });
            return;
        }
        this.log.debug(`Opening app ${val as string} on WebOS TV: ${this.config.ip}`);
        this.sendCommand('ssap://system.launcher/launch', { id: val }, err => {
            if (!err) {
                void this.setState('states.launch', val, true);
            } else {
                this.log.debug(`Error opening app ${val as string} on WebOS TV: ${this.config.ip}`);
            }
        });
    }

    private handleRemoteKey(id: string, state: ioBroker.State): void {
        this.log.debug(`State change "${id}" - VALUE: ${JSON.stringify(state)}`);
        const ids = id.split('.');
        const stateName = ids[ids.length - 1].toString();

        if (stateName.toLowerCase() === 'power' && state.val) {
            // The TV only answers on the pointer input socket while it is running.
            // Send the POWER button to switch it off, wake it via WOL when it is off.
            this.getState(`${this.namespace}.states.on`, (onErr, tvOn) => {
                if (onErr) {
                    this.log.debug(`Error getting "on" state ${onErr}`);
                }
                if (tvOn?.val) {
                    this.sendCommand('button', { name: 'POWER' }, powerErr => {
                        if (!powerErr) {
                            void this.setState(id, state.val, true);
                        }
                    });
                } else {
                    this.wakeTv();
                    void this.setState(id, state.val, true);
                }
            });
            return;
        }

        const key = REMOTE_KEY_MAP[stateName.toLowerCase()] || stateName.toUpperCase();
        this.sendCommand('button', { name: key }, err => {
            if (!err) {
                void this.setState(id, state.val, true);
            }
        });
    }

    private async connect(cb?: () => void): Promise<void> {
        this.hostUrl = `wss://${this.config.ip}:3001`;
        // `reconnect` and `timeout` are declared as numbers, but instances configured with an
        // older admin can still carry strings in `native` — keep the defensive parse.
        let reconnect = parseInt(String(this.config.reconnect), 10);
        if (!reconnect || isNaN(reconnect) || reconnect < 5000) {
            reconnect = 5000;
        }
        const timeout = parseInt(String(this.config.timeout), 10) || 15000;

        // lgtv2 v2 is ESM-only, so the constructor has to be pulled in dynamically here.
        const { default: LGTV } = await import('lgtv2');

        const lgtv = new LGTV({
            url: this.hostUrl,
            timeout,
            reconnect,
            clientKey: this.clientKey,
            saveKey: (key, keyCb) => {
                writeFile(this.keyFile, key, keyCb);
            },
            // lgtv2 v2 option names. The v1 "wsconfig" block is still accepted as a deprecated
            // alias, except for "dropConnectionOnKeepaliveTimeout", which v2 discards: keepalive
            // always closes a dead connection so the built-in reconnection can take over.
            keepalive: true,
            keepaliveInterval: 10000,
            keepaliveGracePeriod: 5000,
            // The TV uses a self-signed certificate. lgtv2 applies this to the control
            // socket and to the pointer input socket, so no process-wide TLS bypass is needed.
            rejectUnauthorized: false,
        });
        this.lgtv = lgtv;

        lgtv.on('connecting', (host: string) => {
            this.lastConnectingAt = Date.now();
            this.log.debug(`Connecting to WebOS TV: ${host}`);
            this.checkConnection();
        });

        lgtv.on('close', e => {
            this.log.debug(`Connection closed: ${JSON.stringify(e)}`);
            this.checkConnection();
        });

        lgtv.on('prompt', () => {
            this.log.debug(`Waiting for pairing confirmation on WebOS TV ${this.config.ip}`);
        });

        lgtv.on('error', error => {
            if (error && /register already in progress/i.test(error.message || String(error))) {
                // webOS 26 may briefly reject a second register while the first
                // pairing request is still being accepted. lgtv2 retries and the
                // following connection succeeds, so this is not actionable.
                return;
            }
            this.log.debug(`Error on connecting or sending command to WebOS TV: ${error}`);
        });

        lgtv.on('connect', () => {
            this.log.debug('WebOS TV Connected');
            this.isConnect = true;
            void this.setStateChanged('info.connection', true, true);
            this.subscribeTv(lgtv);
            cb?.();
        });

        this.lastConnectingAt = Date.now();
        this.watchdogTimer ||= this.setInterval(() => this.checkReconnectWatchdog(), WATCHDOG_CHECK_MS);
    }

    /** All subscriptions and one-shot requests issued right after a successful connection */
    private subscribeTv(lgtv: LgTvClient): void {
        lgtv.subscribe<VolumeResponse>('ssap://audio/getVolume', (_err, res) => {
            this.log.debug(`audio/getVolume: ${JSON.stringify(res)}`);
            /*
                {"changed":["volume"],...,"volume":14,"action":"changed",...}
                {"changed":["muted"],...,"muted":true,"volume":15,...}
            changed in WebOS 5?
                {"volumeStatus":{"cause":"volumeDown",...,"volume":7,"soundOutput":"tv_speaker",...}}
            */
            if (!res) {
                return;
            }
            if (res.changed) {
                if (~res.changed.indexOf('volume') && res.volume !== undefined && res.volume !== null) {
                    this.volume = parseInt(String(res.volume));
                    if (Number.isFinite(this.volume)) {
                        void this.setState('states.volume', this.volume, true);
                    }
                }
                if (~res.changed.indexOf('muted') && res.muted !== undefined && res.muted !== null) {
                    void this.setState('states.mute', !!res.muted, true);
                }
            } else if (res.volumeStatus) {
                const status = res.volumeStatus;
                if (status.volume !== undefined && status.volume !== null) {
                    this.volume = parseInt(String(status.volume));
                    if (Number.isFinite(this.volume)) {
                        void this.setState('states.volume', this.volume, true);
                    }
                }
                if (status.muteStatus !== undefined && status.muteStatus !== null) {
                    void this.setState('states.mute', !!status.muteStatus, true);
                }
                if (status.soundOutput !== undefined && status.soundOutput !== null) {
                    void this.setState('states.soundOutput', status.soundOutput || '', true);
                }
            }
        });

        // `request(uri, cb)` would resolve to the `request(uri, payload?)` promise overload,
        // so the empty payload the library sets itself is passed explicitly here.
        lgtv.request<ExternalInputListResponse>('ssap://tv/getExternalInputList', {}, (err, res) => {
            if (!err && res?.devices) {
                const devices = res.devices;
                this.extendObject('states.input', { common: { states: null } }, () => {
                    void this.extendObject('states.input', { common: { states: inputList(devices) } });
                });
            }
        });

        lgtv.request<LaunchPointsResponse>('ssap://com.webos.applicationManager/listLaunchPoints', {}, (err, res) => {
            if (!err && res?.launchPoints) {
                const points = res.launchPoints;
                this.extendObject('states.launch', { common: { states: null } }, () => {
                    void this.extendObject('states.launch', { common: { states: launchList(points) } });
                });
            }
        });

        lgtv.subscribe<CurrentChannelResponse>('ssap://tv/getCurrentChannel', (err, res) =>
            this.applyCurrentChannel(err, res),
        );

        lgtv.subscribe<ForegroundAppResponse>(
            'ssap://com.webos.applicationManager/getForegroundAppInfo',
            (err, res) => {
                if (err || !res) {
                    this.log.debug(`ERROR on get input and app: ${err}`);
                    return;
                }
                this.log.debug(`DEBUGGING getForegroundAppInfo: ${JSON.stringify(res)}`);
                this.curApp = res.appId || '';
                if (this.curApp) {
                    this.checkCurApp();
                    return;
                }
                // some TV send empty app first if they switched on
                this.setTimeout(() => {
                    if (this.curApp) {
                        return;
                    }
                    // curApp is not set in meantime
                    if (this.healthInterval && !this.config.healthInterval) {
                        this.clearInterval(this.healthInterval);
                        // TV works fine, healthInterval is not longer nessessary
                        this.healthInterval = false;
                        this.log.info(
                            'detect poweroff event, polling not longer nessesary. if you have problems, check settings',
                        );
                    }
                    this.checkCurApp(); // so TV is off
                }, 1500);
            },
        );

        lgtv.subscribe<SoundOutputResponse>('ssap://com.webos.service.apiadapter/audio/getSoundOutput', (err, res) => {
            if (!err && res) {
                this.log.debug(`audio/getSoundOutput: ${JSON.stringify(res)}`);
                if (res.soundOutput !== undefined) {
                    void this.setState('states.soundOutput', res.soundOutput || '', true);
                }
            } else {
                this.log.debug(`ERROR on getSoundOutput: ${err}`);
            }
        });

        // Subscribe to each picture setting individually — bundling keys into a
        // single request silently drops the whole subscription on TVs that do not
        // support every key (varies by webOS version and model).
        PICTURE_KEYS.forEach(key => {
            const cat = 'picture';
            lgtv.subscribe<SystemSettingsResponse>(
                'ssap://settings/getSystemSettings',
                { category: cat, keys: [key] },
                (err, res) => {
                    if (err) {
                        this.log.debug(`getSystemSettings(${cat}.${key}) error: ${err}`);
                        return;
                    }
                    const raw = res?.settings?.[key];
                    if (raw !== undefined && raw !== null) {
                        const value = coercePictureValue(key, raw);
                        if (value !== null) {
                            this.log.debug(`getSystemSettings ${cat}.${key}: ${value}`);
                            void this.setState(`states.picture.${key}`, value, true);
                        }
                    } else {
                        this.log.debug(
                            `getSystemSettings ${cat}.${key} no value: ${JSON.stringify(res).slice(0, 200)}`,
                        );
                    }
                },
            );
        });

        this.sendCommand('ssap://api/getServiceList', null, (err, val) => {
            if (!err) {
                this.log.debug(`Service list: ${JSON.stringify(val)}`);
            }
        });

        this.sendCommand<SwInformationResponse>(
            'ssap://com.webos.service.update/getCurrentSWInformation',
            null,
            (err, val) => {
                if (err) {
                    return;
                }
                this.log.debug(`getCurrentSWInformation: ${JSON.stringify(val)}`);
                const mac = this.config.mac ? this.config.mac : val?.device_id;
                if (mac !== undefined && mac !== null) {
                    void this.setState('states.mac', mac, true);
                } else {
                    this.log.info('Skipping states.mac update because device_id is missing');
                    void this.setState('states.mac', '', true);
                }
            },
        );

        this.sendCommand<SystemInfoResponse>('ssap://system/getSystemInfo', null, (err, val) => {
            if (err) {
                return;
            }
            this.log.debug(`getSystemInfo: ${JSON.stringify(val)}`);
            if (val?.modelName !== undefined && val.modelName !== null) {
                void this.setState('states.model', val.modelName, true);
            } else {
                this.log.info('Skipping states.model update because modelName is missing');
                void this.setState('states.model', '', true);
            }
        });
    }

    private applyCurrentChannel(err: Error | null | undefined, res?: CurrentChannelResponse): void {
        if (err || !res) {
            this.log.debug(`ERROR on getCurrentChannel: ${err}`);
            return;
        }
        this.log.debug(`tv/getCurrentChannel: ${JSON.stringify(res)}`);
        if (res.channelNumber !== undefined) {
            void this.setState('states.channel', res.channelNumber || '', true);
        }
        if (res.channelId !== undefined) {
            void this.setState('states.channelId', res.channelId || '', true);
        }
    }

    /**
     * Writes a single picture setting via the createAlert + onClick(luna) bridge.
     * The direct ssap setSystemSettings path is not exposed on the public web
     * socket interface, so we hand the actual luna URI to a system alert which the
     * TV executes via its onclose/onfail handlers. The alert is closed
     * programmatically right after creation, keeping the popup invisible.
     */
    private setPictureSetting(key: string, value: ioBroker.StateValue): void {
        // Boolean-typed picture states (currently only eyeComfortMode) map to
        // 'on' / 'off' before crossing the Luna boundary. The state itself is
        // typed `boolean` in io-package.json, so we ack the original boolean
        // back unchanged, and the Admin UI shows a real toggle.
        let lunaValue: ioBroker.StateValue = value;
        let ackValue: ioBroker.StateValue = value;
        if (PICTURE_BOOLEAN_KEYS.has(key)) {
            const mapped = pictureBoolToLuna(value);
            if (mapped === null) {
                this.log.warn(`set picture.${key}=${value as string} ignored — value is not a boolean`);
                return;
            }
            lunaValue = mapped;
            // Re-coerce so a tolerated 'on'/'true'-string write also acks as boolean.
            ackValue = mapped === 'on';
        }
        const params = { category: setCategoryFor(key), settings: { [key]: lunaValue } };
        const lunaUri = 'luna://com.webos.settingsservice/setSystemSettings';
        this.sendCommand<CreateAlertResponse>(
            'ssap://system.notifications/createAlert',
            {
                title: ' ',
                message: ' ',
                modal: true,
                type: 'confirm',
                isSysReq: true,
                buttons: [{ label: 'OK', focus: true, buttonType: 'ok', onClick: lunaUri, params }],
                onclose: { uri: lunaUri, params },
                onfail: { uri: lunaUri, params },
            },
            (err, val) => {
                if (err) {
                    this.log.warn(`set picture.${key}=${lunaValue as string} failed: ${err}`);
                    return;
                }
                this.log.debug(`set picture.${key}=${lunaValue as string}: ${JSON.stringify(val)}`);
                void this.setState(`states.picture.${key}`, ackValue, true);
                if (val?.alertId) {
                    this.sendCommand('ssap://system.notifications/closeAlert', { alertId: val.alertId });
                }
            },
        );
    }

    private checkConnection(secondCheck?: boolean): void {
        if (secondCheck) {
            if (!this.isConnect) {
                void this.setStateChanged('info.connection', false, true);
                if (this.healthInterval) {
                    this.clearInterval(this.healthInterval);
                }
                this.checkCurApp(true);
            }
        } else {
            this.isConnect = false;
            // check if isConnect is changed in 10 sec
            this.setTimeout(() => this.checkConnection(true), 10000);
        }
    }

    private checkReconnectWatchdog(): void {
        if (this.isConnect || this.watchdogProbeInFlight) {
            return;
        }
        const idleMs = Date.now() - this.lastConnectingAt;
        if (idleMs <= WATCHDOG_STUCK_MS) {
            return;
        }
        this.watchdogProbeInFlight = true;
        probeTcpReachable(this.config.ip, WATCHDOG_PROBE_PORT, WATCHDOG_PROBE_TIMEOUT_MS)
            .then(reachable => {
                if (!reachable) {
                    // TV is off / unreachable — defer the next probe by a full
                    // window so we don't poll the network every 30s while the TV
                    // sleeps. The lgtv2 library keeps retrying internally; the
                    // watchdog only steps in once it sees a stuck handshake.
                    this.lastConnectingAt = Date.now();
                    this.log.debug(
                        `[WATCHDOG] TV ${this.config.ip}:${WATCHDOG_PROBE_PORT} not reachable — skipping recreate`,
                    );
                    return;
                }
                this.log.warn(
                    `[WATCHDOG] No reconnect attempt for ${Math.round(idleMs / 1000)}s while disconnected — recreating LGTV instance`,
                );
                try {
                    void this.lgtv?.disconnect(); // the returned promise never rejects
                } catch (err) {
                    this.log.debug(`[WATCHDOG] disconnect failed: ${err as string}`);
                }
                // Suppress retrigger until the new instance has had a chance to settle.
                this.lastConnectingAt = Date.now();
                this.setTimeout(() => void this.connect(), 1000);
            })
            .catch(err => {
                this.log.debug(`[WATCHDOG] probe failed: ${err as string}`);
            })
            .finally(() => {
                this.watchdogProbeInFlight = false;
            });
    }

    private checkCurApp(powerOff?: boolean): void {
        if (powerOff) {
            this.curApp = '';
        }
        const isTVon = !!this.curApp;
        this.log.debug(this.curApp ? `cur app is ${this.curApp}` : 'TV is off');

        if (this.curApp === 'com.webos.app.livetv') {
            this.setTimeout(() => {
                this.lgtv?.subscribe<CurrentChannelResponse>('ssap://tv/getCurrentChannel', (err, res) =>
                    this.applyCurrentChannel(err, res),
                );
            }, 3000);
        }

        void this.setStateChanged('states.currentApp', this.curApp, true);
        const inp = this.curApp.split('.').pop();
        if (inp && inp.indexOf('hdmi') === 0) {
            void this.setStateChanged('states.input', `HDMI_${inp[4]}`, true);
            void this.setStateChanged('states.launch', '', true);
        } else {
            void this.setStateChanged('states.input', '', true);
            void this.setStateChanged('states.launch', inp || '', true);
        }
        void this.setStateChanged('states.power', isTVon, true);
        this.setStateChanged('states.on', isTVon, true, (_err, _stateId, notChanged) => {
            if (notChanged) {
                return;
            }
            // state was changed
            this.clearTimeout(this.renewTimeout); // avoid toggeling
            if (!isTVon) {
                return;
            }
            // if tv is now switched on ...
            this.log.debug('renew connection in one minute for stable subscriptions...');
            this.renewTimeout = this.setTimeout(() => {
                void this.lgtv?.disconnect(); // the returned promise never rejects
                const lgtvConnect = this.lgtv?.connect;
                if (lgtvConnect) {
                    this.setTimeout(lgtvConnect, 500, this.hostUrl);
                }
                if (this.healthInterval !== false) {
                    this.healthInterval = this.setInterval(
                        () =>
                            this.sendCommand('ssap://com.webos.service.tv.time/getCurrentTime', null, err => {
                                this.log.debug(`check TV connection: ${err || 'ok'}`);
                                if (err) {
                                    this.checkCurApp(true);
                                }
                            }),
                        this.config.healthInterval || 60000,
                    );
                }
            }, 60000);
        });
    }

    private sendCommand<T extends SsapResponse = SsapResponse>(
        cmd: string,
        options: CommandPayload = null,
        cb?: CommandCallback<T>,
    ): void {
        if (this.isConnect) {
            this.sendPacket<T>(cmd, options, (error, response) => cb?.(error, response));
        }
    }

    private sendPacket<T extends SsapResponse = SsapResponse>(
        cmd: string,
        options: CommandPayload,
        cb?: CommandCallback<T>,
    ): void {
        const lgtv = this.lgtv;
        if (!lgtv) {
            return;
        }
        if (~cmd.indexOf('ssap:') || ~cmd.indexOf('com.')) {
            lgtv.request<T>(cmd, options ?? {}, (error, response) => {
                if (error) {
                    this.log.debug(`ERROR! Response from TV: ${response ? JSON.stringify(response) : error}`);
                }
                cb?.(error, response);
            });
        } else {
            lgtv.getSocket('ssap://com.webos.service.networkinput/getPointerInputSocket', (err, sock) => {
                if (err || !sock) {
                    this.log.debug(`ERROR opening WebOS remote input socket: ${err}`);
                    cb?.(err ?? new Error('no socket'));
                    return;
                }
                try {
                    sock.send(cmd, (options ?? {}) as Record<string, string | number>);
                    cb?.(null, { returnValue: true } as T);
                } catch (sendError) {
                    this.log.debug(`ERROR sending WebOS remote input command: ${sendError as string}`);
                    cb?.(sendError as Error);
                }
            });
        }
    }

    private wakeTv(): void {
        this.getState(`${this.namespace}.states.mac`, (err, macState) => {
            if (err) {
                this.log.debug(`Error getting "mac" state: ${err}`);
            }
            // states.mac is only filled after the first successful connection, so fall back to the configured MAC
            const mac = String(macState?.val || this.config.mac || '').trim();
            if (!mac) {
                this.log.error('Cannot wake TV: no MAC address configured or learned yet.');
                return;
            }

            const wakeOptions = this.config.wolwithip ? { address: this.config.ip } : undefined;
            try {
                // wol.wake() throws synchronously on a malformed MAC address
                wake(mac, wakeOptions, wakeError => {
                    if (wakeError) {
                        this.log.error(`WOL failed for TV ${mac}: ${wakeError}`);
                    } else {
                        this.log.debug(`Sent WOL to TV MAC ${mac}`);
                    }
                })
                    // the returned promise rejects in addition to the callback and would else terminate the adapter
                    .catch(wakeError => this.log.debug(`WOL promise rejected for TV ${mac}: ${wakeError}`));
            } catch (e) {
                this.log.error(`Cannot wake TV: invalid MAC address "${mac}": ${e as string}`);
            }
        });
    }

    private setVolume(val: number): void {
        if (val >= this.volume + 5) {
            let vol = this.oldVolume;
            const interval = this.setInterval(() => {
                vol = vol + 2;
                if (vol >= val) {
                    vol = val;
                    this.clearInterval(interval);
                }
                this.sendCommand('ssap://audio/setVolume', { volume: vol });
            }, 500);
        } else {
            this.sendCommand('ssap://audio/setVolume', { volume: val });
        }
    }

    private onReady(): void {
        if (!this.config.ip) {
            this.log.error('No configure IP address');
            return;
        }
        this.log.info(`Ready. Configured WebOS TV IP: ${this.config.ip}`);
        void this.subscribeStates('*');

        const dir = join(utils.getAbsoluteDefaultDataDir(), this.namespace.replace('.', '_'));
        this.keyFile = join(dir, this.keyFile);
        this.log.debug(`adapter.config = ${JSON.stringify(this.config)}`);

        this.config.healthInterval = parseInt(String(this.config.healthInterval), 10) || 0;
        if (this.config.healthInterval < 1) {
            this.healthInterval = false;
        } else if (this.config.healthInterval < 5000) {
            this.log.info(`Health-Interval must not be less than 5s; setting adjusted.`);
            this.config.healthInterval = 5000;
        }

        if (!existsSync(dir)) {
            mkdirSync(dir);
        }

        readFile(this.keyFile, (err, data) => {
            if (err) {
                writeFile(this.keyFile, '', writeErr => {
                    if (writeErr) {
                        this.log.error(`writeFile ERROR = ${JSON.stringify(writeErr)}`);
                    }
                });
            } else {
                this.clientKey = data.toString();
            }
            void this.connect();
        });
    }

    private onUnload(callback: () => void): void {
        try {
            this.clearTimeout(this.renewTimeout);
            if (this.healthInterval) {
                this.clearInterval(this.healthInterval);
            }
            if (this.watchdogTimer) {
                this.clearInterval(this.watchdogTimer);
                this.watchdogTimer = undefined;
            }
            void this.lgtv?.disconnect(); // the returned promise never rejects
            this.isConnect = false;
        } catch {
            // ignore errors during shutdown
        }
        callback();
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new LgTv(options);
} else {
    // otherwise start the instance directly
    (() => new LgTv())();
}
