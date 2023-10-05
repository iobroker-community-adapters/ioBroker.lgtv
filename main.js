'use strict';

const utils = require('@iobroker/adapter-core');
let adapter;
const LGTV = require('lgtv2');
const wol = require('wol');
const fs = require('fs');
const path = require('path');

let hostUrl;
let isConnect = false;
let lgtvobj, clientKey, volume, oldvolume;
let keyfile = 'lgtvkeyfile';
let renewTimeout = null;
let healthInterval = null;
let curApp = '';

function startAdapter(options) {
    options = options || {};
    Object.assign(options, {
        systemConfig: true,
        name: 'lgtv',
        stateChange: (id, state) => {
            if (id && state && !state.ack) {
                id = id.substring(adapter.namespace.length + 1);
                let vals, dx, dy;
                if (~state.val.toString().indexOf(',')) {
                    vals = state.val.toString().split(',');
                    dx = parseInt(vals[0]);
                    dy = parseInt(vals[1]);
                }
                adapter.log.debug('State change "' + id + '" - VALUE: ' + state.val);
                switch (id) {
                    case 'states.popup':
                        adapter.log.debug(
                            'Sending popup message "' + state.val + '" to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://system.notifications/createToast', { message: state.val }, (err, _val) => {
                            if (!err) adapter.setState('states.popup', state.val, true);
                        });
                        break;
                    case 'states.turnOff':
                        adapter.log.debug('Sending turn OFF command to WebOS TV: ' + adapter.config.ip);
                        if (adapter.config.power) {
                            sendCommand('button', { name: 'power' }, (err, _val) => {
                                if (!err) adapter.setState('states.turnOff', state.val, true);
                            });
                        } else {
                            sendCommand('ssap://system/turnOff', { message: state.val }, (err, _) => {
                                if (!err) adapter.setState('states.turnOff', state.val, true);
                            });
                        }
                        break;

                    case 'states.power':
                        if (!state.val) {
                            adapter.log.debug('Sending turn OFF command to WebOS TV: ' + adapter.config.ip);
                            if (adapter.config.power) {
                                sendCommand('button', { name: 'power' }, (err, _val) => {
                                    if (!err) adapter.setState('states.power', state.val, true);
                                });
                            } else {
                                sendCommand('ssap://system/turnOff', { message: state.val }, (err, _val) => {
                                    if (!err) adapter.setState('states.power', state.val, true);
                                });
                            }
                        } else {
                            adapter.getState(adapter.namespace + '.states.mac', (err, state) => {
                                adapter.log.debug('GetState mac: ' + JSON.stringify(state));
                                if (state) {
                                    wol.wake(state.val, (err, _res) => {
                                        if (!err) adapter.log.debug('Send WOL to MAC: {' + state.val + '} OK');
                                    });
                                } else {
                                    adapter.log.error(
                                        'Error get MAC address TV. Please turn on the TV manually first!',
                                    );
                                }
                            });
                        }
                        break;

                    case 'states.mute':
                        adapter.log.debug('Sending mute ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
                        sendCommand('ssap://audio/setMute', { mute: state.val }, (err, _val) => {
                            if (!err) adapter.setState('states.mute', state.val, true);
                        });
                        break;

                    case 'states.volume':
                        adapter.log.debug(
                            'Sending volume change ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        oldvolume = volume;
                        SetVolume(state.val);
                        break;

                    case 'states.volumeUp':
                        adapter.log.debug(
                            'Sending volumeUp ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://audio/volumeUp', null, (err, _val) => {
                            if (!err) adapter.setState('states.volumeUp', !!state.val, true);
                        });
                        break;

                    case 'states.volumeDown':
                        adapter.log.debug(
                            'Sending volumeDown ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://audio/volumeDown', null, (err, _val) => {
                            if (!err) adapter.setState('states.volumeDown', !!state.val, true);
                        });
                        break;

                    case 'states.channel':
                        adapter.log.debug(
                            'Sending switch to channel ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://tv/openChannel', { channelNumber: state.val.toString() }, (err, _val) => {
                            if (!err) adapter.setState('states.channel', state.val, true);
                            else adapter.log.debug('Error in switching to channel: ' + err);
                        });
                        break;

                    case 'states.channelUp':
                        adapter.log.debug(
                            'Sending channelUp ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://tv/channelUp', null, (err, _val) => {
                            if (!err) adapter.setState('states.channelUp', !!state.val, true);
                        });
                        break;

                    case 'states.channelDown':
                        adapter.log.debug(
                            'Sending channelDown ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://tv/channelDown', null, (err, _val) => {
                            if (!err) adapter.setState('states.channelDown', !!state.val, true);
                        });
                        break;

                    case 'states.mediaPlay':
                        adapter.log.debug(
                            'Sending mediaPlay ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://media.controls/play', null, (err, _) => {
                            if (!err) adapter.setState('states.mediaPlay', !!state.val, true);
                        });
                        break;

                    case 'states.mediaPause':
                        adapter.log.debug(
                            'Sending mediaPause ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://media.controls/pause', null, (err, _val) => {
                            if (!err) adapter.setState('states.mediaPause', !!state.val, true);
                        });
                        break;

                    case 'states.openURL':
                        if (!state.val) return adapter.setState('states.openURL', '', true);
                        adapter.log.debug('Sending open ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
                        sendCommand('ssap://system.launcher/open', { target: state.val }, (err, _val) => {
                            if (!err) adapter.setState('states.openURL', state.val, true);
                        });
                        break;

                    case 'states.mediaStop':
                        adapter.log.debug(
                            'Sending mediaStop ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://media.controls/stop', null, (err, _val) => {
                            if (!err) adapter.setState('states.mediaStop', !!state.val, true);
                        });
                        break;

                    case 'states.mediaFastForward':
                        adapter.log.debug(
                            'Sending mediaFastForward ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://media.controls/fastForward', null, (err, _val) => {
                            if (!err) adapter.setState('states.mediaFastForward', !!state.val, true);
                        });
                        break;

                    case 'states.mediaRewind':
                        adapter.log.debug(
                            'Sending mediaRewind ' + state.val + ' command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://media.controls/rewind', null, (err, _val) => {
                            if (!err) adapter.setState('states.mediaRewind', !!state.val, true);
                        });
                        break;

                    case 'states.3Dmode':
                        adapter.log.debug('Sending 3Dmode ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
                        switch (state.val) {
                            case true:
                                sendCommand('ssap://com.webos.service.tv.display/set3DOn', null, (err, _val) => {
                                    if (!err) adapter.setState('states.3Dmode', !!state.val, true);
                                });
                                break;

                            case false:
                                sendCommand('ssap://com.webos.service.tv.display/set3DOff', null, (err, _val) => {
                                    if (!err) adapter.setState('states.3Dmode', !!state.val, true);
                                });
                                break;
                        }
                        break;

                    case 'states.launch':
                        adapter.log.debug('Sending launch command ' + state.val + ' to WebOS TV: ' + adapter.config.ip);
                        switch (state.val) {
                            case 'livetv':
                                adapter.log.debug('Switching to LiveTV on WebOS TV: ' + adapter.config.ip);
                                sendCommand(
                                    'ssap://system.launcher/launch',
                                    { id: 'com.webos.app.livetv' },
                                    (err, _val) => {
                                        if (!err) adapter.setState('states.launch', state.val, true);
                                    },
                                );
                                break;
                            case 'smartshare':
                                adapter.log.debug('Switching to SmartShare App on WebOS TV: ' + adapter.config.ip);
                                sendCommand(
                                    'ssap://system.launcher/launch',
                                    { id: 'com.webos.app.smartshare' },
                                    (err, _val) => {
                                        if (!err) adapter.setState('states.launch', state.val, true);
                                    },
                                );
                                break;
                            case 'tvuserguide':
                                adapter.log.debug('Switching to TV Userguide App on WebOS TV: ' + adapter.config.ip);
                                sendCommand(
                                    'ssap://system.launcher/launch',
                                    { id: 'com.webos.app.tvuserguide' },
                                    (err, _val) => {
                                        if (!err) adapter.setState('states.launch', state.val, true);
                                    },
                                );
                                break;
                            case 'netflix':
                                adapter.log.debug('Switching to Netflix App on WebOS TV: ' + adapter.config.ip);
                                sendCommand('ssap://system.launcher/launch', { id: 'netflix' }, (err, _val) => {
                                    if (!err) adapter.setState('states.launch', state.val, true);
                                });
                                break;
                            case 'youtube':
                                adapter.log.debug('Switching to Youtube App on WebOS TV: ' + adapter.config.ip);
                                sendCommand(
                                    'ssap://system.launcher/launch',
                                    { id: 'youtube.leanback.v4' },
                                    (err, _val) => {
                                        if (!err) adapter.setState('states.launch', state.val, true);
                                    },
                                );
                                break;
                            case 'prime':
                                adapter.log.debug('Switching to Amazon Prime App on WebOS TV: ' + adapter.config.ip);
                                sendCommand('ssap://system.launcher/launch', { id: 'lovefilm.de' }, (err, _val) => {
                                    if (!err) adapter.setState('states.launch', state.val, true);
                                });
                                break;
                            case 'amazon':
                                adapter.log.debug('Switching to Amazon Prime App on WebOS TV: ' + adapter.config.ip);
                                sendCommand('ssap://system.launcher/launch', { id: 'amazon' }, (err, _val) => {
                                    if (!err) adapter.setState('states.launch', state.val, true);
                                });
                                break;
                            default:
                                //state.val = '"' + state.val + '"';
                                adapter.log.debug('Opening app ' + state.val + ' on WebOS TV: ' + adapter.config.ip);
                                sendCommand('ssap://system.launcher/launch', { id: state.val }, (err, _val) => {
                                    if (!err) adapter.setState('states.launch', state.val, true);
                                    else
                                        adapter.log.debug(
                                            'Error opening app ' + state.val + ' on WebOS TV: ' + adapter.config.ip,
                                        );
                                });

                                break;
                        }
                        break;

                    case 'states.input':
                        adapter.log.debug(
                            'Sending switch to input "' + state.val + '" command to WebOS TV: ' + adapter.config.ip,
                        );
                        sendCommand('ssap://tv/switchInput', { inputId: state.val }, (err, val) => {
                            if (!err && val.returnValue) adapter.setState('states.input', state.val, true);
                        });

                        break;

                    case 'states.raw':
                        adapter.log.debug(
                            'Sending RAW command api "' + state.val + '" to WebOS TV: ' + adapter.config.ip,
                        );
                        try {
                            const obj = JSON.parse(state.val);
                            sendCommand(obj.url, obj.cmd, (err, val) => {
                                if (!err) {
                                    adapter.log.debug('Response RAW  command api ' + JSON.stringify(val));
                                    adapter.setState('states.raw', JSON.stringify(val), true);
                                }
                            });
                        } catch (e) {
                            adapter.log.error('Parse error RAW command api - ' + e);
                        }
                        break;

                    case 'states.youtube': {
                        let uri = state.val;
                        if (!uri) return adapter.setState('states.youtube', '', true);
                        if (!~uri.indexOf('http')) {
                            uri = 'https://www.youtube.com/watch?v=' + uri;
                        }
                        sendCommand(
                            'ssap://system.launcher/launch',
                            { id: 'youtube.leanback.v4', contentId: uri },
                            (err, _val) => {
                                if (!err) adapter.setState('states.youtube', state.val, true);
                            },
                        );
                        break;
                    }

                    case 'states.drag':
                        // The event type is 'move' for both moves and drags.
                        if (dx && dy) {
                            sendCommand('move', { dx: dx, dy: dy, drag: vals[2] === 'drag' ? 1 : 0 }, (err, _val) => {
                                if (!err) adapter.setState(id, state.val, true);
                            });
                        }
                        break;

                    case 'states.scroll':
                        if (dx && dy) {
                            sendCommand('scroll', { dx: dx, dy: dy }, (err, _val) => {
                                if (!err) adapter.setState(id, state.val, true);
                            });
                        }
                        break;

                    case 'states.click':
                        sendCommand('click', {}, (err, _val) => {
                            if (!err) adapter.setState(id, state.val, true);
                        });
                        break;

                    case 'states.soundOutput':
                        sendCommand(
                            'ssap://com.webos.service.apiadapter/audio/changeSoundOutput',
                            { output: state.val },
                            (err, _val) => {
                                if (!err) adapter.setState(id, state.val, true);
                            },
                        );
                        break;

                    default:
                        if (~id.indexOf('remote')) {
                            adapter.log.debug('State change "' + id + '" - VALUE: ' + JSON.stringify(state));
                            const ids = id.split('.');
                            const key = ids[ids.length - 1].toString().toUpperCase();
                            sendCommand('button', { name: key }, (err, _val) => {
                                if (!err) adapter.setState(id, state.val, true); // ?
                            });
                        }
                        break;
                }
            }
        },
        unload: (callback) => {
            renewTimeout && clearTimeout(renewTimeout);
            lgtvobj && lgtvobj.disconnect();
            isConnect = false;
            checkConnection(true);
            callback();
        },
        ready: () => {
            main();
        },
    });

    adapter = new utils.Adapter(options);

    return adapter;
}

function connect(cb){
    hostUrl = 'wss://' + adapter.config.ip + ':3001';
    let reconnect = adapter.config.reconnect;
    if (!reconnect || isNaN(reconnect) || reconnect < 5000)
        reconnect= 5000;
    lgtvobj = new LGTV({
        url:       hostUrl,
        timeout:   adapter.config.timeout,
        reconnect: reconnect,
        clientKey: clientKey,
        saveKey:   (key, cb) => {
            fs.writeFile(keyfile, key, cb);
        },
        wsconfig: {
            keepalive: true,
            tlsOptions: {
                rejectUnauthorized: false
            }
        }
    });
    lgtvobj.on('connecting', (host) => {
        adapter.log.debug('Connecting to WebOS TV: ' + host);
        checkConnection();
    });

    lgtvobj.on('close', (e) => {
        adapter.log.debug('Connection closed: ' + e);
        checkConnection();
    });

    lgtvobj.on('prompt', () => {
        adapter.log.debug('Waiting for pairing confirmation on WebOS TV ' + adapter.config.ip);
    });

    lgtvobj.on('error', (error) => {
        adapter.log.debug('Error on connecting or sending command to WebOS TV: ' + error);
    });

    lgtvobj.on('connect', (_error, _response) => {
        adapter.log.debug('WebOS TV Connected');
        isConnect = true;
        adapter.setStateChanged('info.connection', true, true);
        lgtvobj.subscribe('ssap://audio/getVolume', (err, res) => {
            adapter.log.debug('audio/getVolume: ' + JSON.stringify(res));
            /*
                {"changed":["volume"],"returnValue":true,"cause":"volumeUp","volumeMax":100,"scenario":"mastervolume_tv_speaker","muted":false,"volume":14,"action":"changed","supportvolume"...
                {"changed":["muted"],"returnValue":true,"volumeMax":100,"scenario":"mastervolume_tv_speaker","muted":true,"volume":15,"caller":"com.webos.surfacemanager.audio","action":"change..
            changed in WebOS 5?
                {"volumeStatus":{"cause":"volumeDown","mode":"normal","adjustVolume":true,"activeStatus":true,"muteStatus":false,"volume":7,"soundOutput":"tv_speaker","maxVolume":100}
                {"volumeStatus":{"activeStatus":true,"adjustVolume":true,"maxVolume":100,"muteStatus":true,"volume":10,"mode":"normal","soundOutput":"tv_speaker"}

            */
            if (res) {
                if (res.changed) {
                    if (~res.changed.indexOf('volume')) {
                        volume = parseInt(res.volume);
                        adapter.setState('states.volume', volume, true);
                    }
                    if (~res.changed.indexOf('muted')) {
                        adapter.setState('states.mute', res.muted, true);
                    }
                } else if (res.volumeStatus) {
                    volume = parseInt(res.volumeStatus.volume);
                    adapter.setState('states.volume', volume, true);
                    adapter.setState('states.mute', res.volumeStatus.muteStatus, true);
                }
            }
        });
        lgtvobj.request('ssap://tv/getExternalInputList', (err, res) => {
            if (!err && res.devices) {
                adapter.extendObject('states.input', { common: { states: null } }, () => {
                    adapter.extendObject('states.input', { common: { states: inputList(res.devices) } });
                });
            }
        });
        lgtvobj.request('ssap://com.webos.applicationManager/listLaunchPoints', (err, res) => {
            if (!err && res.launchPoints) {
                adapter.extendObject('states.launch', { common: { states: null } }, () => {
                    adapter.extendObject('states.launch', { common: { states: launchList(res.launchPoints) } });
                });
            }
        });
        lgtvobj.subscribe('ssap://tv/getCurrentChannel', (err, res) => {
            if (!err && res) {
                adapter.log.debug('tv/getCurrentChannel: ' + JSON.stringify(res));
                adapter.setState('states.channel', res.channelNumber || '', true);
                adapter.setState('states.channelId', res.channelId || '', true);
            } else {
                adapter.log.debug('ERROR on getCurrentChannel: ' + err);
            }
        });
        lgtvobj.subscribe('ssap://com.webos.applicationManager/getForegroundAppInfo', (err, res) => {
            if (!err && res) {
                adapter.log.debug('DEBUGGING getForegroundAppInfo: ' + JSON.stringify(res));
                curApp = res.appId || '';
                if (!curApp) {
                    // some TV send empty app first, if they switched on
                    setTimeout(function () {
                        if (!curApp) {
                            // curApp is not set in meantime
                            if (healthInterval && !adapter.config.healthInterval) {
                                clearInterval(healthInterval);
                                healthInterval = false; // TV works fine,  healthInterval is not longer nessessary
                                adapter.log.info(
                                    'detect poweroff event, polling not longer nessesary. if you have problems, check settings',
                                );
                            }
                            checkCurApp(); // so TV is off
                        }
                    }, 1500);
                } else checkCurApp();
            } else {
                adapter.log.debug('ERROR on get input and app: ' + err);
            }
        });
        lgtvobj.subscribe('ssap://com.webos.service.apiadapter/audio/getSoundOutput', (err, res) => {
            if (!err && res) {
                adapter.log.debug('audio/getSoundOutput: ' + JSON.stringify(res));
                adapter.setState('states.soundOutput', res.soundOutput || '', true);
            } else {
                adapter.log.debug('ERROR on getSoundOutput: ' + err);
            }
        });
        sendCommand('ssap://api/getServiceList', null, (err, val) => {
            if (!err) adapter.log.debug('Service list: ' + JSON.stringify(val));
        });
        sendCommand('ssap://com.webos.service.update/getCurrentSWInformation', null, (err, val) => {
            if (!err) {
                adapter.log.debug('getCurrentSWInformation: ' + JSON.stringify(val));
                adapter.setState('states.mac', adapter.config.mac ? adapter.config.mac : val.device_id, true);
            }
        });
        sendCommand('ssap://system/getSystemInfo', null, (err, val) => {
            if (!err) {
                adapter.log.debug('getSystemInfo: ' + JSON.stringify(val));
                adapter.setState('states.model', val.modelName, true);
            }
        });
        cb && cb();
    });
}

const launchList = (arr) => {
    const obj = { livetv: 'Live TV' };
    arr.forEach(function (o, _i) {
        obj[o.id] = o.title;
    });
    return obj;
};

const inputList = (arr) => {
    const obj = {};
    arr.forEach(function (o, _i) {
        obj[o.id] = o.label + ' (' + o.id + ')';
    });
    return obj;
};
function checkConnection(secondCheck) {
    if (secondCheck) {
        if (!isConnect) {
            adapter.setStateChanged('info.connection', false, true);
            healthInterval && clearInterval(healthInterval);
            checkCurApp(true);
        }
    } else {
        isConnect = false;
        setTimeout(checkConnection, 10000, true); //check, if isConnect is changed in 10 sec
    }
}

function checkCurApp(powerOff){
    if (powerOff){
        curApp= '';
    }
    const isTVon= !!curApp;
    adapter.log.debug(curApp ? 'cur app is ' + curApp : 'TV is off');

    if (curApp == 'com.webos.app.livetv') {
        setTimeout(() => {
            lgtvobj.subscribe('ssap://tv/getCurrentChannel', (err, res) => {
                if (!err && res){
                    adapter.log.debug('tv/getCurrentChannel: ' + JSON.stringify(res));
                    adapter.setState('states.channel', res.channelNumber || '', true);
                    adapter.setState('states.channelId', res.channelId ||'', true);
                } else {
                    adapter.log.debug('ERROR on getCurrentChannel: ' + err);
                }
            });
        }, 3000);
    }

    adapter.setStateChanged('states.currentApp', curApp, true);
    const inp = curApp.split('.').pop();
    if (inp && inp.indexOf('hdmi') == 0) {
        adapter.setStateChanged('states.input', 'HDMI_' + inp[4], true);
        adapter.setStateChanged('states.launch', '', true);
    } else {
        adapter.setStateChanged('states.input', '', true);
        adapter.setStateChanged('states.launch', inp, true);
    }
    adapter.setStateChanged('states.power', isTVon, true);
    adapter.setStateChanged('states.on', isTVon, true, function(err,stateID, notChanged) {
        if (!notChanged){ // state was changed
            renewTimeout && clearTimeout(renewTimeout); // avoid toggeling
            if (isTVon){ // if tv is now switched on ...
                adapter.log.debug('renew connection in one minute for stable subscriptions...');
                renewTimeout = setTimeout(() => {
                    lgtvobj.disconnect();
                    setTimeout(lgtvobj.connect,500,hostUrl);
                    if (healthInterval !== false){
                        healthInterval= setInterval(sendCommand, adapter.config.healthInterval || 60000, 'ssap://com.webos.service.tv.time/getCurrentTime', null, (err, _val) => {
                            adapter.log.debug('check TV connection: ' + (err || 'ok'));
                            if (err)
                                checkCurApp(true);
                        });
                    }
                }, 60000);
            }

        }
    });
}

function sendCommand(cmd, options, cb) {
    if (isConnect) {
        sendPacket(cmd, options, (_error, response) => {
            cb && cb(_error, response);
        });
    }
}

function sendPacket(cmd, options, cb){
    if (~cmd.indexOf('ssap:') || ~cmd.indexOf('com.')){
        lgtvobj.request(cmd, options, (_error, response) => {
            if (_error){
                adapter.log.debug('ERROR! Response from TV: ' + (response ? JSON.stringify(response) :_error));
            }
            cb && cb(_error, response);
        });
    } else {
        bypassCertificateValidation();
        lgtvobj.getSocket('ssap://com.webos.service.networkinput/getPointerInputSocket', (err, sock) => {
            if (!err){
                sock.send(cmd, options);
            }
        });
    }
}

function bypassCertificateValidation() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const tls = require('tls');

    tls.checkServerIdentity = (_servername, _cert) => {
        // Skip certificate verification
        return undefined;
    };
}

function SetVolume(val) {
    if (val >= volume + 5) {
        let vol = oldvolume;
        const interval = setInterval(() => {
            vol = vol + 2;
            if (vol >= val) {
                vol = val;
                clearInterval(interval);
            }
            sendCommand('ssap://audio/setVolume', { volume: vol }, (err, _resp) => {
                if (!err) {
                    //
                }
            });
        }, 500);
    } else {
        sendCommand('ssap://audio/setVolume', { volume: val }, (err, _resp) => {
            if (!err) {
                //
            }
        });
    }
}

function main() {
    if (adapter.config.ip) {
        adapter.log.info('Ready. Configured WebOS TV IP: ' + adapter.config.ip);
        adapter.subscribeStates('*');
        const dir = path.join(utils.getAbsoluteDefaultDataDir(), adapter.namespace.replace('.', '_'));
        keyfile = path.join(dir, keyfile);
        adapter.log.debug('adapter.config = ' + JSON.stringify(adapter.config));
        if (adapter.config.healthInterval < 1) healthInterval = false;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        fs.readFile(keyfile, (err, data) => {
            if (!err) {
                try {
                    clientKey = data.toString();
                } catch (err) {
                    fs.writeFile(keyfile, '', (err) => {
                        if (err) adapter.log.error('writeFile ERROR = ' + JSON.stringify(err));
                    });
                }
            } else {
                fs.writeFile(keyfile, '', (err) => {
                    if (err) adapter.log.error('writeFile ERROR = ' + JSON.stringify(err));
                });
            }
            connect();
        });
    } else {
        adapter.log.error('No configure IP address');
    }
}

// If started as allInOne/compact mode => return function to create instance
// @ts-ignore
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
