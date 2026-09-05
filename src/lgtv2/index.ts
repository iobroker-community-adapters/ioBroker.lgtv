/**
 *      Lgtv2 - Simple Node.js module to remotely control LG WebOS smart TVs
 *
 *      MIT (c) Sebastian Raff <hq@ccu.io> (https://github.com/hobbyquaker)
 *      this is a fork of https://github.com/msloth/lgtv.js, heavily modified and rewritten to suit my needs.
 *
 *      Vendored copy of https://github.com/hobbyquaker/lgtv2 (v2.0.0, commit da521d78), ported from
 *      JavaScript to TypeScript for this adapter: the constructor function is a real class now, and the
 *      handwritten `index.d.ts` is gone - the declarations in this file are the single source of truth
 *      for the implementation and for the public types. Upstream stays JavaScript, so a change there
 *      has to be ported over by hand.
 *
 *      Two details of the published (ESM-only) package are intentionally not part of this port because
 *      the adapter is built as CommonJS:
 *        - `createRequire(import.meta.url)('./pairing.json')` is a plain JSON import here,
 *        - the `module.exports` alias export (require(esm) interop) is gone, and with it the 1.x style
 *          call without `new` - always use `new LGTV(...)`.
 */

import fs from 'node:fs';
import os from 'node:os';
import dgram from 'node:dgram';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import type { IncomingMessage } from 'node:http';
import type { DetailedPeerCertificate, TLSSocket } from 'node:tls';
import WebSocket, { type ClientOptions, type RawData } from 'ws';

import pairingTemplate from './pairing.json';

export type Callback<T = any> = (err: Error | null | undefined, result?: T) => void;

/** stores the client key the TV handed out after pairing */
export type SaveKey = (key: string, cb: (err?: Error | null) => void) => void;

export interface Options {
    /** hostname or IP of the TV; used with `secure`/`port`/`ports` to build the URL */
    host?: string;
    /** `true` → wss://host:3001, `false` → ws://host:3000; omitted → try both, wss first */
    secure?: boolean;
    /** fixed port (disables the automatic fallback) */
    port?: number;
    /** ports used for wss/ws, default `{secure: 3001, insecure: 3000}` */
    ports?: { secure?: number; insecure?: number };
    /** complete websocket URL; takes precedence over host/secure/port */
    url?: string;
    /** verify the TV's TLS certificate against public CAs, default false */
    rejectUnauthorized?: boolean;
    /**
     * additional certificate check: `'lg'` (a chain must contain LG's TV certificate or intermediate CA),
     * `'tofu'` (pin the first-seen certificate in `certFile`), or one/several SHA-256 fingerprints
     */
    // the two magic words are spelled out for the editor hint, any other string is a fingerprint
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    verifyCert?: false | 'lg' | 'tofu' | string | string[];
    /** file for the tofu fingerprint, default `<keyFile>.cert` */
    certFile?: string;
    /** request timeout in ms, default 15000 */
    timeout?: number;
    /** websocket handshake timeout in ms, default 10000, 0 disables */
    handshakeTimeout?: number;
    /** reconnect interval in ms, default 5000; false/0 disables */
    reconnect?: number | false;
    /** ping the TV regularly and drop the connection when it stops answering, default true */
    keepalive?: boolean;
    /** ms between pings, default 10000 */
    keepaliveInterval?: number;
    /** ms to wait for the pong, default 5000 */
    keepaliveGracePeriod?: number;
    /** client key file, default `~/.lgtv2/keyfile-<host>` (or $LGTV2_KEY_DIR) */
    keyFile?: string;
    /** custom key storage */
    saveKey?: SaveKey;
    /** supply the client key directly */
    clientKey?: string;
    /** MAC address for `wake()`; overrides the MACs learned from the TV */
    mac?: string;
    /** learn wired/Wi-Fi MACs from the TV after pairing and cache them in `macFile`, default true */
    learnMac?: boolean;
    /** file for the learned MACs, default `<keyFile>.mac` */
    macFile?: string;
    /** extra options for the underlying `ws` client (e.g. `ca`, `cert`, `headers`) */
    wsOptions?: ClientOptions;
    /** @deprecated 1.x name: keepalive settings and `tlsOptions` are still understood */
    wsconfig?: Record<string, any>;
}

export interface WakeOptions {
    /** default '255.255.255.255' */
    address?: string;
    /** default 9 */
    port?: number;
    /** packets to send, default 3 */
    count?: number;
    /** ms between packets, default 100 */
    interval?: number;
}

export type PowerState = 'on' | 'standby' | 'screen_off' | 'screen_saver' | 'off' | 'unknown';

export interface PowerStateResult {
    state: PowerState;
    raw: any;
}

/** MAC addresses of the TV, learned from com.webos.service.connectionmanager */
export interface Macs {
    wired?: string;
    wifi?: string;
}

export interface KeepaliveSettings {
    keepalive: boolean;
    keepaliveInterval: number;
    keepaliveGracePeriod: number;
}

/** socket for pointer/button/keyboard input (getPointerInputSocket etc.) */
export interface SpecializedSocket {
    send(type: string, payload?: Record<string, string | number>): void;
    close(): void;
}

export interface SsapError extends Error {
    code: 'ESSAP';
    errorCode?: number | string;
    errorText?: string;
    payload?: any;
}

/** the arguments every event carries */
export interface EventMap {
    connecting: [url: string];
    prompt: [];
    connect: [];
    close: [info: { code: number; reason: string }];
    error: [err: Error];
    /** every raw frame received from the TV, as text */
    message: [raw: string];
    certificate: [info: { fingerprint: string; stored: boolean }];
    mac: [macs: Macs];
}

/** the options with everything the instance actually uses filled in */
interface ResolvedOptions extends Options {
    url: string;
    secure: boolean;
    timeout: number;
    reconnect: number | false;
    handshakeTimeout: number;
    rejectUnauthorized: boolean;
    certFile: string;
    macFile: string;
    learnMac: boolean;
}

/** a request/subscription waiting for its response */
interface PendingCall {
    type: 'request' | 'subscribe' | 'register';
    cb: Callback;
}

/** an SSAP frame as sent by the TV */
interface SsapMessage {
    id?: string;
    type?: string;
    error?: string;
    payload?: any;
}

/** the last volume /mute seen on a subscription, used to rebuild the `changed` array */
interface VolumeSnapshot {
    volume?: unknown;
    muted?: unknown;
}

const DEFAULT_KEEPALIVE: KeepaliveSettings = {
    keepalive: true,
    keepaliveInterval: 10000,
    keepaliveGracePeriod: 5000,
};

const PORT_SECURE = 3001;
const PORT_INSECURE = 3000;

/**
 * SHA-256 fingerprints of the certificates LG webOS TVs present on port 3001, used by
 * `verifyCert: 'lg'` (a chain matching any of them is accepted):
 *  - leaf "LGE TV SSG" (serial 0x2001) - one static certificate and key on every TV
 *    (seen on 2018-2023 models, EU/US/JP, firmware up to late 2025),
 *  - its issuer "LGE SSG Intermediate CA" (serial 0x1007, issued by "LG webOS TV Root CA").
 * Both are valid 2018-03-12 .. 2034-08-15.
 */
const LG_ISSUER_FINGERPRINTS: string[] = [
    // LGE SSG Intermediate CA
    'E2:BD:64:64:D3:F5:1C:1B:95:B7:69:7D:9D:67:73:C3:3D:94:12:EB:A0:29:9C:56:8C:34:93:7D:3F:E6:8A:A0',
    // LGE TV SSG (leaf)
    '11:C5:B1:C5:90:77:50:AB:B9:DA:2A:66:65:CC:CE:2B:B2:88:A5:83:F4:5A:33:39:E7:1F:87:BF:2F:80:85:52',
];

const POWER_STATES: Record<string, PowerState> = {
    Active: 'on',
    'Active Standby': 'standby',
    Suspend: 'off',
    'Screen Off': 'screen_off',
    'Screen Saver': 'screen_saver',
    'Power Off': 'off',
};

/** an Error with the extra properties the SSAP/transport errors carry */
function taggedError<T extends object>(message: string, extra: T): Error & T {
    return Object.assign(new Error(message), extra);
}

function normalizeFingerprint(fp: string): string {
    return String(fp)
        .replace(/^sha256\//i, '')
        .replace(/[^0-9a-f]/gi, '')
        .toUpperCase()
        .replace(/(..)(?=.)/g, '$1:');
}

/** all certificates the peer presented: leaf first, then issuers */
function peerChain(tlsSocket: TLSSocket): DetailedPeerCertificate[] {
    const chain: DetailedPeerCertificate[] = [];
    let cert: DetailedPeerCertificate | undefined = tlsSocket.getPeerCertificate(true);
    const seen = new Set<string>();
    while (cert?.fingerprint256 && !seen.has(cert.fingerprint256)) {
        seen.add(cert.fingerprint256);
        chain.push(cert);
        cert = cert.issuerCertificate;
    }
    return chain;
}

function magicPacket(mac: string): Buffer {
    const hex = String(mac).replace(/[^0-9a-f]/gi, '');
    if (hex.length !== 12) {
        throw new Error(`invalid MAC address ${mac}`);
    }
    const macBuf = Buffer.from(hex, 'hex');
    const buf = Buffer.alloc(6 + 16 * 6, 0xff);
    for (let i = 0; i < 16; i++) {
        macBuf.copy(buf, 6 + i * 6);
    }
    return buf;
}

/** one MAC, `opts.count` magic packets */
function sendMagicPacket(mac: string, opts: Required<WakeOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
        let packet: Buffer;
        try {
            packet = magicPacket(mac);
        } catch (err) {
            reject(err as Error);
            return;
        }
        const socket = dgram.createSocket(opts.address.includes(':') ? 'udp6' : 'udp4');
        let sent = 0;
        const finish = (err?: Error | null): void => {
            socket.close();
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        };
        socket.once('error', finish);
        socket.bind(() => {
            try {
                socket.setBroadcast(true);
            } catch {
                // unicast address or platform without broadcast support
            }
            const sendOne = (): void => {
                socket.send(packet, 0, packet.length, opts.port, opts.address, err => {
                    if (err) {
                        finish(err);
                        return;
                    }
                    sent++;
                    if (sent >= opts.count) {
                        finish();
                    } else {
                        setTimeout(sendOne, opts.interval);
                    }
                });
            };
            sendOne();
        });
    });
}

function wakeAll(mac: string | string[], options?: WakeOptions): Promise<void> {
    const opts: Required<WakeOptions> = {
        address: '255.255.255.255',
        port: 9,
        count: 3,
        interval: 100,
        ...options,
    };
    if (!Array.isArray(mac)) {
        return sendMagicPacket(mac, opts);
    }
    // several candidate MACs (e.g. wired + Wi-Fi): wake all of them
    const macs = [
        ...new Set(
            mac.map(m =>
                String(m)
                    .replace(/[^0-9a-f]/gi, '')
                    .toLowerCase(),
            ),
        ),
    ];
    if (!macs.length) {
        return Promise.reject(new Error('no MAC address known - pass one or connect to the TV once'));
    }
    return Promise.all(macs.map(m => sendMagicPacket(m, opts))).then(() => undefined);
}

/**
 * Send a Wake-on-LAN magic packet. Usable without an instance: LGTV.wake(mac).
 * options: address (default '255.255.255.255'), port (default 9), count (default 3), interval ms (default 100)
 */
export function wake(mac: string | string[], options?: WakeOptions): Promise<void>;
export function wake(mac: string | string[], cb: (err?: Error | null) => void): void;
export function wake(mac: string | string[], options: WakeOptions | undefined, cb: (err?: Error | null) => void): void;
export function wake(
    mac: string | string[],
    options?: WakeOptions | ((err?: Error | null) => void),
    cb?: (err?: Error | null) => void,
): Promise<void> | void {
    const callback = typeof options === 'function' ? options : cb;
    const promise = wakeAll(mac, typeof options === 'function' ? undefined : options);
    if (callback) {
        promise.then(() => callback(null), callback);
        return undefined;
    }
    return promise;
}

/**
 * Directory for the client key files. The same locations persist-path used
 * (Windows: %APPDATA%/lgtv2, macOS: ~/Library/Preferences/lgtv2, else ~/.lgtv2),
 * but do not throw when HOME/APPDATA are missing (systemd units without User=).
 */
function defaultKeyDir(): string {
    if (process.env.LGTV2_KEY_DIR) {
        return process.env.LGTV2_KEY_DIR;
    }
    if (process.env.APPDATA) {
        return path.join(process.env.APPDATA, 'lgtv2');
    }
    let home: string | undefined = process.env.HOME;
    if (!home) {
        try {
            home = os.homedir();
        } catch {
            home = undefined;
        }
    }
    if (!home) {
        return path.join(os.tmpdir(), 'lgtv2');
    }
    if (process.platform === 'darwin') {
        return path.join(home, 'Library/Preferences', 'lgtv2');
    }
    return path.join(home, '.lgtv2');
}

function hostnameFromUrl(url: string): string {
    try {
        const hostname = new URL(url).hostname;
        // IPv6 literals come with brackets and colons, neither is nice in a file name
        return hostname.replace(/^\[|]$/g, '').replace(/[^\w.-]/g, '_');
    } catch {
        return String(url).replace(/[^\w.-]/g, '_');
    }
}

function buildUrl(config: Pick<Options, 'url' | 'secure' | 'port' | 'ports' | 'host'>): string {
    if (config.url) {
        return config.url;
    }
    const secure = config.secure !== false;
    const ports = { secure: PORT_SECURE, insecure: PORT_INSECURE, ...config.ports };
    const port = config.port || (secure ? ports.secure : ports.insecure);
    let host = config.host || 'lgwebostv';
    if (host.includes(':') && !host.startsWith('[')) {
        host = `[${host}]`;
    }
    return `${secure ? 'wss' : 'ws'}://${host}:${port}`;
}

/**
 * Maps an SSAP response to (err, payload). Error responses (`type: 'error'`)
 * and `returnValue: false` payloads become Errors carrying the TV's details.
 */
function responseToError(message: SsapMessage): SsapError | null {
    const payload = message.payload || {};
    if (message.type === 'error') {
        return taggedError(message.error || 'unknown error', { code: 'ESSAP' as const, payload });
    }
    if (payload.returnValue === false) {
        return taggedError(String(payload.errorText || payload.errorCode || 'request failed'), {
            code: 'ESSAP' as const,
            errorCode: payload.errorCode,
            errorText: payload.errorText,
            payload,
        });
    }
    return null;
}

/**
 * Older firmware answers audio/getVolume with {volume, muted, changed: [...]}, newer
 * firmware with {volumeStatus: {volume, muteStatus, ...}} and no `changed` array.
 * Normalize to the old shape so subscribers can keep using `res.changed`.
 */
function normalizeVolumePayload(payload: any, state: VolumeSnapshot): any {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }
    const status = payload.volumeStatus;
    if (status && typeof status === 'object') {
        if (payload.volume === undefined && status.volume !== undefined) {
            payload.volume = status.volume;
        }
        if (payload.muted === undefined && status.muteStatus !== undefined) {
            payload.muted = status.muteStatus;
        }
        if (payload.soundOutput === undefined && status.soundOutput !== undefined) {
            payload.soundOutput = status.soundOutput;
        }
    }
    const hasVolume = payload.volume !== undefined;
    const hasMuted = payload.muted !== undefined;
    if (!hasVolume && !hasMuted) {
        return payload;
    }
    if (!Array.isArray(payload.changed)) {
        payload.changed = [];
    }
    if (hasVolume && payload.volume !== state.volume && !payload.changed.includes('volume')) {
        payload.changed.push('volume');
    }
    if (hasMuted && payload.muted !== state.muted && !payload.changed.includes('muted')) {
        payload.changed.push('muted');
    }
    state.volume = payload.volume;
    state.muted = payload.muted;
    return payload;
}

/** ws hands the frame over as Buffer, ArrayBuffer or Buffer[], depending on how it arrived */
function rawDataToText(data: RawData | string): string {
    if (typeof data === 'string') {
        return data;
    }
    if (Array.isArray(data)) {
        return Buffer.concat(data).toString();
    }
    return Buffer.isBuffer(data) ? data.toString() : Buffer.from(data).toString();
}

function toPowerStateResult(res?: { state?: string }): PowerStateResult {
    const raw = res?.state;
    return {
        state: (typeof raw === 'string' && POWER_STATES[raw]) || 'unknown',
        raw: res,
    };
}

/** Socket for pointer/button/keyboard input (getPointerInputSocket etc.) */
class PointerInputSocket implements SpecializedSocket {
    private readonly ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
    }

    send(type: string, payload?: Record<string, string | number>): void {
        // The message should be key:value pairs, one per line,
        // with an extra blank line to terminate.
        const lines = [`type:${type}`, ...Object.entries(payload || {}).map(([key, value]) => `${key}:${value}`)];
        const message = `${lines.join('\n')}\n\n`;
        this.ws.send(message);
    }

    close(): void {
        this.ws.close();
    }
}

class LGTV extends EventEmitter<EventMap> {
    /** URLs that will be tried in order */
    readonly urls: string[];
    readonly keyFile: string | undefined;
    readonly certFile: string;
    readonly macFile: string;
    readonly wsOptions: ClientOptions;
    readonly keepalive: KeepaliveSettings;
    clientKey: string | undefined;
    /** stores the client key received from the TV, replaced by `options.saveKey` */
    saveKey: SaveKey;
    /** @deprecated 1.x flag, `true` between a successful pairing and the next close - use `connected` */
    connection = false;

    /** send a Wake-on-LAN magic packet */
    static wake = wake;
    static readonly LG_ISSUER_FINGERPRINTS: string[] = LG_ISSUER_FINGERPRINTS.slice();
    static readonly POWER_STATES: Record<string, PowerState> = { ...POWER_STATES };

    private readonly config: ResolvedOptions;
    /** the URLs to try: wss and ws, unless url, secure or port pinned one of them */
    private readonly candidates: string[];
    private readonly autoPort: boolean;
    private candidateIndex = 0;
    private cycleTried = 0;
    private cycleErrors: string[] = [];

    /** current ws instance (connecting or open) */
    private ws: WebSocket | null = null;
    /** open + usable ws */
    private activeSocket: WebSocket | null = null;
    private isPaired = false;
    private autoReconnect: number | false;
    private stopped = false;
    private initialTimer: NodeJS.Timeout | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private keepaliveTimer: NodeJS.Timeout | null = null;
    private keepaliveGraceTimer: NodeJS.Timeout | null = null;

    private readonly specializedSockets = new Map<string, PointerInputSocket>();
    private readonly callbacks = new Map<string, PendingCall>();
    private readonly timers = new Map<string, NodeJS.Timeout>();
    private readonly volumeState = new Map<string, VolumeSnapshot>();
    private cidCount = 0;
    private readonly cidPrefix = `0000000${Math.floor(Math.random() * 0xffffffff).toString(16)}`.slice(-8);
    private lastError: string | undefined;
    private learnedMacs: Macs = {};

    constructor(options?: Options) {
        super();

        const config = { ...options } as ResolvedOptions;

        // Without an explicit url/secure/port, try wss://host:3001 (2018+ firmware) first and
        // fall back to ws://host:3000 (older TVs) automatically; the working one is kept.
        this.autoPort = !config.url && config.secure === undefined && !config.port;
        this.candidates = this.autoPort
            ? [buildUrl({ ...config, secure: true }), buildUrl({ ...config, secure: false })]
            : [buildUrl(config)];
        config.url = this.candidates[0];
        config.secure = config.url.startsWith('wss://');
        this.urls = this.candidates.slice();

        config.timeout ||= 15000;
        config.reconnect ??= 5000;
        config.handshakeTimeout ??= 10000;
        config.rejectUnauthorized ??= false;
        this.autoReconnect = config.reconnect;

        // websocket options: the keepalive settings are ours, everything else goes to `ws`
        // (`wsconfig` and `wsconfig.tlsOptions` from 1.x are still accepted)
        const legacy: Record<string, any> = { ...config.wsconfig };
        const legacyTls: Record<string, any> = { ...legacy.tlsOptions };
        delete legacy.tlsOptions;
        delete legacy.dropConnectionOnKeepaliveTimeout;
        this.keepalive = {
            keepalive: config.keepalive ?? legacy.keepalive ?? DEFAULT_KEEPALIVE.keepalive,
            keepaliveInterval:
                config.keepaliveInterval ?? legacy.keepaliveInterval ?? DEFAULT_KEEPALIVE.keepaliveInterval,
            keepaliveGracePeriod:
                config.keepaliveGracePeriod ?? legacy.keepaliveGracePeriod ?? DEFAULT_KEEPALIVE.keepaliveGracePeriod,
        };
        for (const key of Object.keys(DEFAULT_KEEPALIVE)) {
            delete legacy[key];
        }
        this.wsOptions = {
            rejectUnauthorized: config.rejectUnauthorized,
            ...legacy,
            ...legacyTls,
            ...config.wsOptions,
        };

        if (config.clientKey === undefined) {
            if (!config.keyFile) {
                config.keyFile = path.join(defaultKeyDir(), `keyfile-${hostnameFromUrl(config.url)}`);
            }
            try {
                this.clientKey = fs.readFileSync(config.keyFile).toString();
            } catch {
                // no key yet, pairing prompt will follow
            }
        } else {
            this.clientKey = config.clientKey;
        }
        this.keyFile = config.keyFile;
        if (!config.certFile) {
            config.certFile = config.keyFile
                ? `${config.keyFile}.cert`
                : path.join(defaultKeyDir(), `certfile-${hostnameFromUrl(config.url)}`);
        }
        this.certFile = config.certFile;

        // MAC addresses learned from the TV (com.webos.service.connectionmanager/getinfo) for wake()
        config.learnMac = config.learnMac !== false;
        if (!config.macFile) {
            config.macFile = config.keyFile
                ? `${config.keyFile}.mac`
                : path.join(defaultKeyDir(), `macfile-${hostnameFromUrl(config.url)}`);
        }
        this.macFile = config.macFile;
        try {
            this.learnedMacs = JSON.parse(fs.readFileSync(config.macFile, 'utf8')) || {};
        } catch {
            // nothing learned yet
        }

        this.saveKey = config.saveKey || ((key, cb) => this.storeKey(key, cb));
        this.config = config;

        this.initialTimer = setTimeout(() => {
            this.initialTimer = null;
            this.connect(config.url);
        }, 0);
    }

    /** true while connected and paired */
    get connected(): boolean {
        return this.activeSocket?.readyState === WebSocket.OPEN && this.isPaired;
    }

    /** MACs learned from the TV */
    get macs(): Macs {
        return { ...this.learnedMacs };
    }

    /** MAC `wake()` will use first: the `mac` option, else the learned wired, else Wi-Fi MAC */
    get mac(): string | undefined {
        return this.macCandidates()[0];
    }

    /**
     *      Connect to TV using a websocket url (eg "wss://192.168.0.100:3001")
     *
     *      A bound instance property, not a prototype method, exactly like in the JavaScript
     *      original: callers pass it to `setTimeout` detached and would otherwise lose `this`.
     */
    connect = (url?: string): void => {
        this.autoReconnect = this.config.reconnect;
        this.stopped = false;
        const host = url || this.config.url;

        if (this.activeSocket?.readyState === WebSocket.OPEN) {
            if (!this.isPaired) {
                this.register();
            }
            return;
        }
        if (this.ws?.readyState === WebSocket.CONNECTING) {
            return;
        }

        this.emit('connecting', host);
        let opened = false;
        let rejected = false;
        let lastSocketError: Error | null = null;
        const socket = new WebSocket(host, this.mainWsOptions());
        this.ws = socket;

        socket.on('upgrade', (response: IncomingMessage) => {
            const certError = this.verifyPeer(response.socket as TLSSocket);
            if (certError) {
                rejected = true;
                socket.terminate();
                this.emitError(certError);
                this.scheduleReconnect();
            }
        });
        socket.on('open', () => {
            if (rejected) {
                return;
            }
            opened = true;
            this.openConnection(socket);
        });
        socket.on('error', error => {
            if (!opened) {
                lastSocketError = error;
            } else {
                this.emit('error', error);
            }
        });
        socket.on('close', (code, reason) => {
            if (this.ws === socket) {
                this.ws = null;
            }
            if (rejected) {
                return;
            }
            if (!opened) {
                this.connectFailed(lastSocketError || new Error(`connection closed during handshake (${code})`));
                return;
            }
            this.stopKeepalive();
            this.activeSocket = null;
            this.failPendingRequests('connection closed');
            this.emit('close', { code, reason: reason?.toString() ?? '' });
            this.connection = false;
            this.scheduleReconnect();
        });
    };

    register(): void {
        const pairing: Record<string, any> = { ...pairingTemplate };
        if (this.clientKey) {
            pairing['client-key'] = this.clientKey;
        }

        this.send('register', undefined, pairing, (err, res?: Record<string, any>) => {
            if (err) {
                // e.g. "403 cancelled" when the user declines on the TV
                this.emit('error', err);
                return;
            }
            if (res && typeof res['client-key'] === 'string' && res['client-key'] !== '') {
                this.isPaired = true;
                this.connection = true;
                this.emit('connect');
                if (this.config.learnMac) {
                    this.learnMacs();
                }
                if (res['client-key'] !== this.clientKey) {
                    this.saveKey(res['client-key'], saveErr => {
                        if (saveErr) {
                            this.emit('error', saveErr);
                        }
                    });
                }
            } else {
                this.emit('prompt');
            }
        });
    }

    // the callback form comes first: a function also satisfies `Record<string, any>`, so with the
    // promise overload in front `request(uri, cb)` would type the callback as a payload and claim a
    // Promise return, while at runtime it returns the request id
    request<T = any>(uri: string, cb: Callback<T>): string | undefined;
    request<T = any>(uri: string, payload?: Record<string, any>): Promise<T>;
    request<T = any>(uri: string, payload: Record<string, any>, cb: Callback<T>): string | undefined;
    request<T = any>(
        uri: string,
        payload?: Record<string, any> | Callback<T>,
        cb?: Callback<T>,
    ): Promise<T> | string | undefined {
        const callback = typeof payload === 'function' ? payload : cb;
        if (callback) {
            return this.send('request', uri, typeof payload === 'function' ? {} : payload, callback as Callback);
        }
        return new Promise<T>((resolve, reject) => {
            this.send('request', uri, payload as Record<string, any>, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res as T);
                }
            });
        });
    }

    subscribe<T = any>(uri: string, cb: Callback<T>): string | undefined;
    subscribe<T = any>(uri: string, payload: Record<string, any>, cb: Callback<T>): string | undefined;
    subscribe<T = any>(uri: string, payload: Record<string, any> | Callback<T>, cb?: Callback<T>): string | undefined {
        return this.send('subscribe', uri, payload as Record<string, any>, cb as Callback);
    }

    unsubscribe(cid: string): boolean {
        if (!this.callbacks.has(cid)) {
            return false;
        }
        this.callbacks.delete(cid);
        this.volumeState.delete(cid);
        if (this.activeSocket?.readyState === WebSocket.OPEN) {
            this.activeSocket.send(JSON.stringify({ id: cid, type: 'unsubscribe' }));
        }
        return true;
    }

    send(
        type: 'request' | 'subscribe' | 'register',
        uri: string | undefined,
        /* optional */ payload?: Record<string, any> | Callback,
        /* optional */ cb?: Callback,
    ): string | undefined {
        const callback: Callback | undefined = typeof payload === 'function' ? (payload as Callback) : cb;
        const body = typeof payload === 'function' || !payload ? {} : payload;

        if (!this.activeSocket || this.activeSocket.readyState !== WebSocket.OPEN) {
            callback?.(new Error('not connected'));
            return undefined;
        }

        const cid = this.getCid();

        const json = JSON.stringify({
            id: cid,
            type,
            uri,
            payload: body,
        });

        if (callback) {
            switch (type) {
                case 'request': {
                    this.callbacks.set(cid, {
                        type,
                        cb: (err, res) => {
                            // Remove callback reference
                            this.callbacks.delete(cid);
                            const pending = this.timers.get(cid);
                            if (pending) {
                                clearTimeout(pending);
                                this.timers.delete(cid);
                            }
                            callback(err, res);
                        },
                    });

                    // Set callback timeout
                    const timer = setTimeout(() => {
                        this.timers.delete(cid);
                        if (this.callbacks.has(cid)) {
                            this.callbacks.delete(cid);
                            callback(new Error('timeout'));
                        }
                    }, this.config.timeout);
                    timer.unref();
                    this.timers.set(cid, timer);
                    break;
                }

                case 'subscribe':
                case 'register':
                    this.callbacks.set(cid, { type, cb: callback });
                    break;
                default:
                    throw new Error('unknown type');
            }
        }
        this.activeSocket.send(json);
        return cid;
    }

    getSocket(uri: string): Promise<SpecializedSocket>;
    getSocket(uri: string, cb: Callback<SpecializedSocket>): void;
    getSocket(uri: string, cb?: Callback<SpecializedSocket>): Promise<SpecializedSocket> | void {
        if (!cb) {
            return new Promise<SpecializedSocket>((resolve, reject) => {
                this.getSocket(uri, (err, sock) => {
                    if (err || !sock) {
                        reject(err || new Error('no socket'));
                    } else {
                        resolve(sock);
                    }
                });
            });
        }

        const known = this.specializedSockets.get(uri);
        if (known) {
            cb(null, known);
            return undefined;
        }

        this.request<{ socketPath?: string }>(uri, {}, (err, data) => {
            if (err) {
                cb(err);
                return;
            }
            if (!data || !data.socketPath) {
                cb(new Error('no socketPath in response'));
                return;
            }

            let done = false;
            const special = new WebSocket(data.socketPath, this.socketWsOptions());
            special.on('open', () => {
                const socket = new PointerInputSocket(special);
                this.specializedSockets.set(uri, socket);
                done = true;
                cb(null, socket);
            });
            special.on('error', error => {
                if (!done) {
                    done = true;
                    cb(error);
                } else {
                    this.emit('error', error);
                }
            });
            special.on('close', () => {
                this.specializedSockets.delete(uri);
            });
        });
        return undefined;
    }

    disconnect(): Promise<void>;
    disconnect(cb: () => void): void;
    disconnect(cb?: () => void): Promise<void> | void {
        this.autoReconnect = false;
        this.stopped = true;
        if (this.initialTimer) {
            clearTimeout(this.initialTimer);
            this.initialTimer = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopKeepalive();

        this.specializedSockets.forEach(socket => socket.close());

        const promise = new Promise<void>(resolve => {
            const socket = this.ws;
            if (socket?.readyState === WebSocket.CONNECTING) {
                socket.once('close', () => resolve());
                socket.terminate();
            } else if (socket?.readyState === WebSocket.OPEN) {
                socket.once('close', () => resolve());
                socket.close();
            } else {
                resolve();
            }
        });
        if (cb) {
            void promise.then(() => cb());
            return undefined;
        }
        return promise;
    }

    /**
     * Wake the TV via Wake-on-LAN. mac defaults to `config.mac`, else to the MACs learned from the TV.
     */
    wake(mac?: string | string[], options?: WakeOptions): Promise<void>;
    wake(options: WakeOptions): Promise<void>;
    wake(mac: string | string[] | undefined, options: WakeOptions | undefined, cb: (err?: Error | null) => void): void;
    wake(
        mac?: string | string[] | WakeOptions,
        options?: WakeOptions,
        cb?: (err?: Error | null) => void,
    ): Promise<void> | void {
        let macs: string | string[] | undefined;
        if (mac && !Array.isArray(mac) && typeof mac === 'object') {
            // wake(options) / wake(options, cb)
            cb = options as unknown as (err?: Error | null) => void;
            options = mac;
        } else {
            macs = mac;
        }
        return wake(macs || this.macCandidates(), options, cb as (err?: Error | null) => void);
    }

    /**
     * Power state via com.webos.service.tvpower/power/getPowerState, mapped to
     * {state: 'on' | 'standby' | 'screen_off' | 'screen_saver' | 'off' | 'unknown', raw}.
     * Note: a TV in deep standby does not answer at all - use `connected` and wake().
     */
    getPowerState(): Promise<PowerStateResult>;
    getPowerState(cb: Callback<PowerStateResult>): void;
    getPowerState(cb?: Callback<PowerStateResult>): Promise<PowerStateResult> | void {
        const uri = 'ssap://com.webos.service.tvpower/power/getPowerState';
        if (cb) {
            this.request<{ state?: string }>(uri, {}, (err, res) => cb(err, err ? undefined : toPowerStateResult(res)));
            return undefined;
        }
        return this.request<{ state?: string }>(uri).then(toPowerStateResult);
    }

    subscribePowerState(cb: Callback<PowerStateResult>): string | undefined {
        return this.subscribe<{ state?: string }>('ssap://com.webos.service.tvpower/power/getPowerState', (err, res) =>
            cb(err, err ? undefined : toPowerStateResult(res)),
        );
    }

    private mainWsOptions(): ClientOptions {
        return {
            ...this.wsOptions,
            ...(this.config.handshakeTimeout ? { handshakeTimeout: this.config.handshakeTimeout } : {}),
        };
    }

    private socketWsOptions(): ClientOptions {
        return { ...this.wsOptions };
    }

    private macCandidates(): string[] {
        if (this.config.mac) {
            return [this.config.mac];
        }
        return [this.learnedMacs.wired, this.learnedMacs.wifi].filter((mac): mac is string => Boolean(mac));
    }

    /** default `saveKey`: write the key next to the other files of this TV */
    private storeKey(key: string, cb: (err?: Error | null) => void): void {
        this.clientKey = key;
        const keyFile = this.config.keyFile;
        if (!keyFile) {
            cb(new Error('no key file configured'));
            return;
        }
        try {
            fs.mkdirSync(path.dirname(keyFile), { recursive: true });
        } catch (err) {
            cb(err as Error);
            return;
        }
        fs.writeFile(keyFile, key, cb);
    }

    private learnMacs(): void {
        this.request<{ wiredInfo?: { macAddress?: string }; wifiInfo?: { macAddress?: string } }>(
            'ssap://com.webos.service.connectionmanager/getinfo',
            {},
            (err, res) => {
                if (err || !res) {
                    return;
                }
                const learned: Macs = {
                    wired: res.wiredInfo?.macAddress,
                    wifi: res.wifiInfo?.macAddress,
                };
                if (!learned.wired && !learned.wifi) {
                    return;
                }
                const changed = learned.wired !== this.learnedMacs.wired || learned.wifi !== this.learnedMacs.wifi;
                this.learnedMacs = learned;
                if (changed) {
                    try {
                        fs.mkdirSync(path.dirname(this.config.macFile), { recursive: true });
                        fs.writeFileSync(this.config.macFile, `${JSON.stringify(this.learnedMacs)}\n`);
                    } catch (writeErr) {
                        this.emit('error', writeErr as Error);
                    }
                }
                this.emit('mac', { ...this.learnedMacs });
            },
        );
    }

    private getCid(): string {
        return this.cidPrefix + `000${(this.cidCount++).toString(16)}`.slice(-4);
    }

    private emitError(error: Error): void {
        if (this.lastError !== error.toString()) {
            this.emit('error', error);
        }
        this.lastError = error.toString();
    }

    private scheduleReconnect(): void {
        if (!this.config.reconnect || this.reconnectTimer) {
            return;
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.autoReconnect) {
                this.connect(this.config.url);
            }
        }, this.config.reconnect);
    }

    private stopKeepalive(): void {
        if (this.keepaliveTimer) {
            clearInterval(this.keepaliveTimer);
            this.keepaliveTimer = null;
        }
        if (this.keepaliveGraceTimer) {
            clearTimeout(this.keepaliveGraceTimer);
            this.keepaliveGraceTimer = null;
        }
    }

    private startKeepalive(socket: WebSocket): void {
        this.stopKeepalive();
        if (!this.keepalive.keepalive) {
            return;
        }
        socket.on('pong', () => {
            if (this.keepaliveGraceTimer) {
                clearTimeout(this.keepaliveGraceTimer);
                this.keepaliveGraceTimer = null;
            }
        });
        this.keepaliveTimer = setInterval(() => {
            if (socket.readyState !== WebSocket.OPEN) {
                return;
            }
            socket.ping();
            if (!this.keepaliveGraceTimer) {
                this.keepaliveGraceTimer = setTimeout(() => {
                    this.keepaliveGraceTimer = null;
                    // no pong in time: the TV went away without closing (standby)
                    socket.terminate();
                }, this.keepalive.keepaliveGracePeriod);
                this.keepaliveGraceTimer.unref();
            }
        }, this.keepalive.keepaliveInterval);
        this.keepaliveTimer.unref();
    }

    private failPendingRequests(reason: string): void {
        for (const [cid, entry] of [...this.callbacks]) {
            this.callbacks.delete(cid);
            const timer = this.timers.get(cid);
            if (timer) {
                clearTimeout(timer);
                this.timers.delete(cid);
            }
            if (entry.type === 'request') {
                entry.cb(new Error(reason));
            }
        }
    }

    /**
     * verifyCert: false (default) | 'lg' | 'tofu' | fingerprint | [fingerprints]
     * Returns an Error when the peer certificate chain is not acceptable.
     */
    private verifyPeer(tlsSocket: TLSSocket | undefined): Error | null {
        const { verifyCert, certFile } = this.config;
        if (!verifyCert || !this.config.secure || typeof tlsSocket?.getPeerCertificate !== 'function') {
            return null;
        }
        const chain = peerChain(tlsSocket);
        if (chain.length === 0) {
            return new Error('certificate verification failed: no peer certificate');
        }
        const fps = chain.map(cert => normalizeFingerprint(cert.fingerprint256));
        const describe = (): string =>
            chain.map(cert => `${String(cert.subject?.CN)} ${cert.fingerprint256}`).join(' <- ');

        let expected: string[];
        if (verifyCert === 'lg') {
            expected = LG_ISSUER_FINGERPRINTS;
        } else if (verifyCert === 'tofu') {
            let stored: string | undefined;
            try {
                stored = fs.readFileSync(certFile, 'utf8').trim();
            } catch {
                stored = undefined;
            }
            if (!stored) {
                try {
                    fs.mkdirSync(path.dirname(certFile), { recursive: true });
                    fs.writeFileSync(certFile, `${fps[0]}\n`);
                } catch (err) {
                    return new Error(`cannot store certificate fingerprint in ${certFile}: ${(err as Error).message}`);
                }
                this.emit('certificate', { fingerprint: fps[0], stored: true });
                return null;
            }
            expected = [stored];
        } else {
            expected = Array.isArray(verifyCert) ? [...verifyCert] : [verifyCert];
        }
        expected = expected.map(normalizeFingerprint);
        if (fps.some(fp => expected.includes(fp))) {
            return null;
        }
        const reason =
            verifyCert === 'tofu'
                ? `fingerprint changed, delete ${certFile} to re-trust`
                : `mode ${String(verifyCert)}`;
        return taggedError(`certificate verification failed (${reason}): ${describe()}`, {
            code: 'ECERT',
            chain: fps,
        });
    }

    /** a connection attempt failed before the socket was open (refused, timeout, TLS, cert) */
    private connectFailed(socketError: Error): void {
        let error = socketError;
        if (/handshake has timed out/i.test(error.message)) {
            error = taggedError(`handshake timeout after ${this.config.handshakeTimeout}ms (${this.config.url})`, {
                code: 'ETIMEDOUT',
            });
        } else if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED' && !this.config.secure && !this.autoPort) {
            error.message += ' - newer TVs only accept wss://<host>:3001, try {secure: true}';
        }
        if (this.candidates.length > 1) {
            this.cycleErrors.push(`${this.config.url}: ${error.message}`);
            this.cycleTried++;
            this.candidateIndex = (this.candidateIndex + 1) % this.candidates.length;
            this.config.url = this.candidates[this.candidateIndex];
            this.config.secure = this.config.url.startsWith('wss://');
            if (this.cycleTried < this.candidates.length) {
                // try the other port right away, without reporting an error yet
                setImmediate(() => {
                    if (!this.stopped) {
                        this.connect(this.config.url);
                    }
                });
                return;
            }
            error = taggedError(`connect failed on all ports (${this.cycleErrors.join('; ')})`, {
                code: 'ECONNFAILED',
            });
            this.cycleTried = 0;
            this.cycleErrors = [];
        }
        this.emitError(error);
        this.scheduleReconnect();
    }

    private handleMessage(data: RawData): void {
        const text = rawDataToText(data);
        this.emit('message', text);
        let parsedMessage: SsapMessage;
        try {
            parsedMessage = JSON.parse(text);
        } catch {
            this.emit('error', new Error(`JSON parse error ${text}`));
            return;
        }
        const cid = parsedMessage?.id;
        const entry = cid === undefined ? undefined : this.callbacks.get(cid);
        if (cid === undefined || !entry) {
            return;
        }
        const err = responseToError(parsedMessage);
        let payload = parsedMessage.payload;
        // some firmware omits `subscribed` on the first response, normalize every subscription payload
        if (entry.type === 'subscribe' && payload && typeof payload === 'object') {
            let state = this.volumeState.get(cid);
            if (!state) {
                state = {};
                this.volumeState.set(cid, state);
            }
            payload = normalizeVolumePayload(payload, state);
        }
        entry.cb(err, payload);
    }

    private openConnection(socket: WebSocket): void {
        this.activeSocket = socket;
        this.lastError = undefined;
        this.cycleTried = 0;
        this.cycleErrors = [];
        this.isPaired = false;
        this.connection = false;
        this.startKeepalive(socket);
        socket.on('message', data => this.handleMessage(data));
        this.register();
    }
}

// The types used to live in a handwritten index.d.ts, where they were reachable as `LGTV.Options`,
// `LGTV.PowerState` and so on. Merging the namespace into the class keeps that spelling working
// next to the plain-named exports above.
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace LGTV {
    export type {
        Callback,
        EventMap,
        KeepaliveSettings,
        Macs,
        Options,
        PowerState,
        PowerStateResult,
        SaveKey,
        SpecializedSocket,
        SsapError,
        WakeOptions,
    };
}

export default LGTV;
export { LGTV, LG_ISSUER_FINGERPRINTS, POWER_STATES };
