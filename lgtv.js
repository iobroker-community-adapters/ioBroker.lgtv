/* jshint -W097 */
/* jshint strict:false */
/* global require */
/* global RRule */
/* global __dirname */
/* jslint node: true */
'use strict';

var fs = require('fs'); // for storing client key
var utils = require('@iobroker/adapter-core');
var adapter;
var LGTV = require('lgtv2');
var wol = require('wol');
var pollTimerChannel		= null;
var pollTimerOnlineStatus	= null;
var pollTimerInput			= null;
var pollTimerGetSoundOutput	= null;
var isConnect = false;
var lgtvobj;

function startAdapter(options) {
	options = options || {};
	Object.assign(options,{
		name:  "lgtv",
		stateChange:  function (id, state) {
			if (id && state && !state.ack) {
				id = id.substring(adapter.namespace.length + 1);
				adapter.log.debug('State change "' + id + '" - VALUE: ' + state.val);
				switch (id)	{
					case 'states.popup':
						adapter.log.debug('Sending popup message "' + state.val + '" to WebOS TV: ' + adapter.config.ip);
						//"iconData", "iconExtension",
						sendCommand('ssap://system.notifications/createToast', {message: state.val}, function (err, val) {
							if (!err) adapter.setState('states.popup', state.val, true);
						});
						break;
					case 'states.turnOff':
						adapter.log.debug('Sending turn OFF command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://system/turnOff', {message: state.val}, function (err, val) {
							if (!err) adapter.setState('states.turnOff', state.val, true);
						});
						break;
						
					case 'states.power':
						adapter.log.debug('Sending turn OFF command to WebOS TV: ' + adapter.config.ip);
						if(!state.val){
							sendCommand('ssap://system/turnOff', {message: state.val}, function (err, val){
								if (!err) adapter.setState('states.power', state.val, true);
							});
						} else {
							adapter.getState(adapter.namespace + '.states.mac', function (err, state){
								adapter.log.debug('GetState mac: ' + JSON.stringify(state));
								if(state){
									wol.wake(state.val, function (err, res){
										if (!err) adapter.log.debug('Send WOL to MAC: {' + state.val + '} OK');
									});
								} else {
									adapter.log.error('Error get MAC address TV. Please turn on the TV manually first!');
								}
							});
						}
						break;

					case 'states.mute':
						adapter.log.debug('Sending mute ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://audio/setMute', {mute: state.val}, function (err, val) {
							if (!err) adapter.setState('states.mute', state.val, true);
						});
						break;

					case 'states.volume':
						adapter.log.debug('Sending volume change ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://audio/setVolume', {volume: state.val}, function (err, val) {
							if (!err)
						});
						break;

					case 'states.volumeUp':
						adapter.log.debug('Sending volumeUp ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://audio/volumeUp', null, function (err, val) {
							if (!err) adapter.setState('states.volumeUp', !!state.val, true);
						});
						break;

					case 'states.volumeDown':
						adapter.log.debug('Sending volumeDown ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://audio/volumeDown', null, function (err, val) {
							if (!err) adapter.setState('states.volumeDown', !!state.val, true);
						});
						break;

					case 'states.channel':
						adapter.log.debug('Sending switch to channel ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://tv/openChannel', {channelNumber: state.val}, function (err, val) {
							if (!err)
								adapter.setState('states.channel', state.val, true);
							else
								adapter.log.debug('Error in switching to channel: ' + err);
						});
						break;

					case 'states.channelUp':
						adapter.log.debug('Sending channelUp ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://tv/channelUp', null, function (err, val) {
							if (!err) adapter.setState('states.channelUp', !!state.val, true);
						});
						break;

					case 'states.channelDown':
						adapter.log.debug('Sending channelDown ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://tv/channelDown', null, function (err, val) {
							if (!err) adapter.setState('states.channelDown', !!state.val, true);
						});
						break;


					case 'states.mediaPlay':
						adapter.log.debug('Sending mediaPlay ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/play', null, function (err, val) {
							if (!err) adapter.setState('states.mediaPlay', !!state.val, true);
						});
						break;

					case 'states.mediaPause':
						adapter.log.debug('Sending mediaPause ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/pause', null, function (err, val) {
							if (!err) adapter.setState('states.mediaPause', !!state.val, true);
						});
						break;

					case 'states.openURL':
						adapter.log.debug('Sending open ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://system.launcher/open', {target: state.val}, function (err, val) {
							if (!err) adapter.setState('states.openURL', state.val, true);
						});
						break;

					case 'states.mediaStop':
						adapter.log.debug('Sending mediaStop ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/stop', null, function (err, val) {
							if (!err) adapter.setState('states.mediaStop', !!state.val, true);
						});
						break;

					case 'states.mediaFastForward':
						adapter.log.debug('Sending mediaFastForward ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/fastForward', null, function (err, val) {
							if (!err) adapter.setState('states.mediaFastForward', !!state.val, true);
						});
						break;

					case 'states.mediaRewind':
						adapter.log.debug('Sending mediaRewind ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/rewind', null, function (err, val) {
							if (!err) adapter.setState('states.mediaRewind', !!state.val, true);
						});
						break;

					case 'states.3Dmode':
						adapter.log.debug('Sending 3Dmode ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						switch (state.val) {
							case true:
								sendCommand('ssap://com.webos.service.tv.display/set3DOn', null, function (err, val) {
									if (!err) adapter.setState('states.3Dmode', !!state.val, true);
								});
								break;

							case false:
								sendCommand('ssap://com.webos.service.tv.display/set3DOff', null, function (err, val) {
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
								sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.livetv"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								};
								break;
							case 'smartshare':
								adapter.log.debug('Switching to SmartShare App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.smartshare"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								};
								break;
							case 'tvuserguide':
								adapter.log.debug('Switching to TV Userguide App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.tvuserguide"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								};
								break;
							case 'netflix':
								adapter.log.debug('Switching to Netflix App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "netflix"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								};
								break;
							case 'youtube':
								adapter.log.debug('Switching to Youtube App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "youtube.leanback.v4"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								};
								break;
							case 'prime':
								adapter.log.debug('Switching to Amazon Prime App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "lovefilm.de"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								};
								break;
							case 'amazon':
								adapter.log.debug('Switching to Amazon Prime App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "amazon"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								};
								break;
							default:
								//state.val = '"' + state.val + '"';
								adapter.log.debug('Opening app ' + state.val + ' on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: state.val}), function (err, val)
								{
									if (!err)
										adapter.setState('states.launch', state.val, true);
									else adapter.log.debug('Error opening app ' + state.val + ' on WebOS TV: ' + adapter.config.ip);
								};

								break;
						}
						break;

					case 'states.input':
						adapter.log.debug('Sending switch to input "' + state.val + '" command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://tv/switchInput', {inputId: state.val}, function (err, val) {
							if (!err) adapter.setState('states.input', state.val, true);
						});

						break;

					case 'states.raw':
						adapter.log.debug('Sending raw command api "' + state.val + '" to WebOS TV: ' + adapter.config.ip);
						sendCommand(state.val[url], state.val[cmd], function (err, val) {
							if (!err) adapter.setState('states.raw', state.val, true);
						});
						break;

					case 'states.youtube':
						var uri = state.val;
						if(!~uri.indexOf('http')){
							uri = 'https://www.youtube.com/watch?v=' + uri;
						}
						sendCommand('ssap://system.launcher/launch', {id: 'youtube.leanback.v4', contentId: uri}, function (err, val) {
							if (!err) adapter.setState('states.youtube', state.val, true);
						});
						break;

					case 'states.drag':
						// The event type is 'move' for both moves and drags.
						var vals = state.val.split(",");
						var dx = parseInt(vals[0]);
						var dy = parseInt(vals[1]);
						sendCommand('move', { dx: dx, dy: dy, drag: vals[2] === 'drag' ? 1 : 0}, function (err, val) {
							if (!err) adapter.setState(id, state.val, true);
						});
						break;

					case 'states.scroll':
						var vals = state.val.split(",");
						var dx = parseInt(vals[0]);
						var dy = parseInt(vals[1]);
						sendCommand('scroll', { dx: dx, dy: dy }, function (err, val) {
							if (!err) adapter.setState(id, state.val, true);
						});
						break;

					case 'states.click':
						sendCommand('click', {}, function (err, val) {
							if (!err) adapter.setState(id, state.val, true);
						});
						break;

					case 'states.soundOutput':
						sendCommand('ssap://com.webos.service.apiadapter/audio/changeSoundOutput', { output: state.val}, function (err, val) {
							if (!err) adapter.setState(id, state.val, true);
						});
						break;

					default:
						if(~id.indexOf('remote')){
							adapter.log.error('State change "' + id + '" - VALUE: ' + JSON.stringify(state));
							var ids = id.split(".");
							var key = ids[ids.length - 1].toString().toUpperCase();
							sendCommand('button', { name: key }, function (err, val) {
								if (!err) adapter.setState(id, state.val, true); // ?
							});
						}
						break;
				}
			}
		},
		unload: function (callback) {
			callback();
		},
		ready: function () {
			main();
		}
	});

	adapter = new utils.Adapter(options);

	return adapter;
}

function sendCommand(cmd, options, cb) {
	if(isConnect){
		sendPacket(cmd, options, cb);
	}
}

function connect(cb){
	lgtvobj = new LGTV({
		url:       'ws://' + adapter.config.ip + ':3000',
		timeout:   adapter.config.timeout,
		reconnect: true,
		keyfile:   'lgtvkeyfile'
	});
	lgtvobj.on('connecting', function (host){
		adapter.log.debug('Connecting to WebOS TV: ' + host);
		adapter.setState('info.connection', false, true);
	});

	lgtvobj.on('close', function (e){
		adapter.log.debug('Connection closed: ' + e);
		adapter.setState('info.connection', false, true);
	});

	lgtvobj.on('prompt', function (){
		adapter.log.debug('Waiting for pairing confirmation on WebOS TV ' + adapter.config.ip);
	});

	lgtvobj.on('error', function (error){
		adapter.log.debug('Error on connecting or sending command to WebOS TV: ' + error);
		adapter.setState('info.connection', false, true);
	});

	lgtvobj.on('connect', function (error, response){
		isConnect = true;
		adapter.setState('info.connection', true, true);
		lgtvobj.subscribe('ssap://audio/getVolume', function(err, res){
			adapter.log.debug('audio/getVolume: ' + JSON.stringify(res));
			if (res.changed.indexOf('volume') !== -1) {
				adapter.setState('states.volume', parseInt(res.volume), true);
			}
			if (res.changed.indexOf('muted') !== -1) {
				adapter.setState('states.mute', res.muted, true);
			}
		});
		cb && cb();
	});
}

function sendPacket(cmd, options, cb){
	if (~cmd.indexOf('ssap:') || ~cmd.indexOf('com.')){
		lgtvobj.request(cmd, options, function (_error, response){
			if (_error){
				adapter.log.debug('ERROR! Response from TV: ' + (response ? JSON.stringify(response) :_error));
			}
			cb && cb(_error, response);
		});
	} else {
		lgtvobj.getSocket('ssap://com.webos.service.networkinput/getPointerInputSocket', function(err, sock){
			if(!err){
				sock.send(cmd, options);
			}
		});
	}
}

function pollChannel() {
	adapter.log.debug('Polling channel');
	sendCommand('ssap://tv/getCurrentChannel', null, function (err, channel)	{
		var JSONChannel, ch;
		JSONChannel = JSON.stringify(channel);
		adapter.log.debug('DEBUGGING CHANNEL POLLING: ' + JSONChannel);
		if (JSONChannel) { 
			ch = JSONChannel.match(/"channelNumber":"(\d+)"/m); 
		}
		if (!err && ch)	{
			adapter.setState('states.channel', ch[1], true);
		} else {
			adapter.setState('states.channel', '', true);
		}

		if (JSONChannel) ch = JSONChannel.match(/.*"channelId":"(.*?)"/m);
		if (!err && ch)	{
			adapter.setState('states.channelId', ch[1], true);
		} else {
			adapter.setState('states.channelId', '', true);
		}
	});
}

function pollOnlineStatus() {
	adapter.log.debug('Polling OnlineStatus');
	sendCommand('com.webos.applicationManager/getForegroundAppInfo', null, function (err, OnlineStatus) {
		adapter.log.debug('DEBUGGING pollOnlineStatus: ' + JSON.stringify(OnlineStatus));
		if (!err && OnlineStatus) {
			adapter.setState('states.on', true, true);
			adapter.setState('states.power', true, true);
		} else {
			adapter.setState('states.on', false, true);
			adapter.setState('states.power', false, true);
			adapter.setState('info.connection', false, true);
		}
	});
}

function pollInputAndCurrentApp() {
	adapter.log.debug('Polling Input and current App');
	sendCommand('ssap://com.webos.applicationManager/getForegroundAppInfo', null, function (err, Input) {
		if (!err && Input) {
			var JSONInput, CurrentInputAndApp;
			JSONInput = JSON.stringify(Input);
			adapter.log.debug('DEBUGGING pollInputAndCurrentApp: ' + JSONInput);
			if (JSONInput) {
				CurrentInputAndApp = JSONInput.match(/.*"appId":"(.*?)"/m);
				if (CurrentInputAndApp)	{
					adapter.setState('states.currentApp', CurrentInputAndApp[1], true);
					var ins = CurrentInputAndApp[1].split(".");
					var input = ins[ins.length - 1].toString();
					adapter.setState('states.input', input, true);
				}
			}
		} else {
			adapter.log.debug('ERROR on polling input and app: ' + err);
		}
	});
}

function pollGetSoundOutput() {
	adapter.log.debug('Polling current sound output');
	sendCommand('ssap://com.webos.service.apiadapter/audio/getSoundOutput', null, function (err, Output)	{
		if (!err && Output) {
			var JSONOutput, CurrentSoundOutput;
			JSONOutput = JSON.stringify(Output);
			adapter.log.debug('DEBUGGING pollGetSoundOutput: ' + JSONOutput);
			if (JSONOutput){
				CurrentSoundOutput = JSONOutput.match(/.*"soundOutput":"(.*?)"/m);
				if (CurrentSoundOutput){
					adapter.setState('states.soundOutput', CurrentSoundOutput[1], true);
				}
			}
		} else {
			adapter.log.debug('ERROR on Polling get current sound output: ' + err);
		}
	});
}

function main() {
	adapter.log.info('Ready. Configured WebOS TV IP: ' + adapter.config.ip);
	adapter.subscribeStates('*');
	connect(function (){
		if (parseInt(adapter.config.interval, 10)) {
			pollTimerChannel = setInterval(pollChannel, parseInt(adapter.config.interval, 10));
			pollTimerOnlineStatus = setInterval(pollOnlineStatus, parseInt(adapter.config.interval, 10));
			pollTimerInput = setInterval(pollInputAndCurrentApp, parseInt(adapter.config.interval, 10));
			pollTimerGetSoundOutput = setInterval(pollGetSoundOutput, parseInt(adapter.config.interval, 10));
		}
		sendCommand('ssap://api/getServiceList', null, function (err, val) {
			if (!err) adapter.log.debug('Service list: ' + JSON.stringify(val));
		});
		sendCommand('ssap://com.webos.service.update/getCurrentSWInformation', null, function (err, val) {
			if (!err) {
				adapter.log.debug('getCurrentSWInformation: ' + JSON.stringify(val));
				adapter.setState('states.mac', val.device_id, true);
			}
		});
		sendCommand('ssap://system/getSystemInfo', null, function (err, val) {
			if (!err) {
				adapter.log.debug('getSystemInfo: ' + JSON.stringify(val));
				adapter.setState('states.model', val.modelName, true);
			}
		});
	});
}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
	module.exports = startAdapter;
} else {
	// or start the instance directly
	startAdapter();
} 
