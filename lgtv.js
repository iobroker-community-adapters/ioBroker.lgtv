/*
DEV NOTES:
lgtvobj.request('ssap://tv/switchInput', {inputId: "SCART_1"});	// Eingang umschalten: AV_1, SCART_1 (Scart), COMP_1 (Component) , HDMI_1 (HDMI 1), HDMI_2 (HDMI 2), HDMI_3 (HDMI 3)
lgtvobj.request('ssap://tv/getCurrentChannel', function (Error, Response)	// Aktueller Sender (Response nach "channelNumber" filtern!!!!)
*/

'use strict';
var fs 				= require('fs'); // for storing client key
var utils 			= require(__dirname + '/lib/utils');
var adapter 		= utils.adapter('lgtv');
var LGTV            = require('lgtv2');
var pollTimer       = null;

function sendCommand(cmd, options, cb) {
	var lgtvobj = new LGTV({
		url: 		'ws://' + adapter.config.IP + ':3000',
		timeout: 	adapter.config.timeout,
		reconnect: 	false
	});
	lgtvobj.on('connecting', function (host)
	{
		adapter.log.debug('Connecting to WebOS TV: ' + host);
	});

	lgtvobj.on('prompt', function ()
	{
		adapter.log.debug('Waiting for pairing confirmation on WebOS TV ' + adapter.config.IP);
	});

	lgtvobj.on('error', function (error)
	{
		adapter.log.error('Error on connecting or sending command to WebOS TV: ' + error);
		cb && cb(error);
	});

	lgtvobj.on('connect', function (error, response)
	{
		lgtvobj.request(cmd, options, function (_error, response)
		{
			if (!_error && JSON.stringify(response).indexOf('"returnValue":true') !== -1)
			{
				adapter.log.debug('Sent popup message "' + state.val + '" to WebOS TV: ' + adapter.config.IP);
			}
			else
			{
				adapter.log.error('ERROR! Response from TV: ' + (response ? JSON.stringify(response) : _error));
			}
			lgtvobj.disconnect();
			cb && cb(_error, response);
		});
	});
}

function pollChannel() {
	sendCommand('ssap://tv/getCurrentChannel', null, function (err, channel) {
		var ch;
		if (channel) ch = channel.match(/"channelNumber":"(\d+)"/m);
		if (!err && ch) {
			adapter.setState('channel', ch[1], true);
			adapter.setState('on', true, true);
		} else {
			adapter.setState('on', false, true);
		}
	});
}

adapter.on('stateChange', function (id, state)
{
    if (id && state && !state.ack)
	{
		id = id.substring(adapter.namespace.length + 1);
		switch (id)
		{
			case 'popup':
				adapter.log.debug('Sending popup message "' + state.val + '" to WebOS TV: ' + adapter.config.IP);
				sendCommand('ssap://system.notifications/createToast', {message: state.val}, function (err, val) {
					if (!err) adapter.setState('popup', state.val, true);
				});
				break;

			case 'turnOff':
				adapter.log.debug('Sending turn OFF command to WebOS TV: ' + adapter.config.IP);
				sendCommand('ssap://system/turnOff', {message: state.val}, function (err, val) {
					if (!err) adapter.setState('turnOff', state.val, true);
				});
				break;

			case 'mute':
				adapter.log.debug('Sending mute ' + state.val + ' command to WebOS TV: ' + adapter.config.IP);
				sendCommand('ssap://audio/setMute', {mute: !!state.val}, function (err, val) {
					if (!err) adapter.setState('mute', !!state.val, true);
				});
				break;

			case 'volumeUp':
				adapter.log.debug('Sending volumeUp ' + state.val + ' command to WebOS TV: ' + adapter.config.IP);
				sendCommand('ssap://audio/volumeUp', null, function (err, val) {
					if (!err) adapter.setState('volumeUp', !!state.val, true);
				});
				break;

			case 'volumeDown':
				adapter.log.debug('Sending volumeDown ' + state.val + ' command to WebOS TV: ' + adapter.config.IP);
				sendCommand('ssap://audio/volumeDown', null, function (err, val) {
					if (!err) adapter.setState('volumeDown', !!state.val, true);
				});
				break;

			case '3Dmode':
				adapter.log.debug('Sending 3Dmode ' + state.val + ' command to WebOS TV: ' + adapter.config.IP);
				switch (state.val)
				{
					case true:
						sendCommand('ssap://com.webos.service.tv.display/set3DOn', null, function (err, val) {
							if (!err) adapter.setState('3Dmode', !!state.val, true);
						});
					break;
					
					case false:
						sendCommand('ssap://com.webos.service.tv.display/set3DOff', null, function (err, val) {
							if (!err) adapter.setState('3Dmode', !!state.val, true);
						});
					break;
				}
				break;

			case 'launch':
				adapter.log.debug('Sending launch command ' + state.val + ' to WebOS TV: ' + adapter.config.IP);
				switch (state.val)
				{
					case 'livetv':
						adapter.log.debug('Switching to LiveTV on WebOS TV: ' + adapter.config.IP);
						sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.livetv"}), function (err, val) {
							if (!err) adapter.setState('launch', state.val, true);
						}
					break;
					case 'smartshare':
						adapter.log.debug('Switching to SmartShare App on WebOS TV: ' + adapter.config.IP);
						sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.smartshare"}), function (err, val) {
							if (!err) adapter.setState('launch', state.val, true);
						}
					break;		
					case 'tvuserguide':
						adapter.log.debug('Switching to TV Userguide App on WebOS TV: ' + adapter.config.IP);
						sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.tvuserguide"}), function (err, val) {
							if (!err) adapter.setState('launch', state.val, true);
						}
					break;	
					case 'netflix':
						adapter.log.debug('Switching to Netflix App on WebOS TV: ' + adapter.config.IP);
						sendCommand('ssap://system.launcher/launch', {id: "netflix"}), function (err, val) {
							if (!err) adapter.setState('launch', state.val, true);
						}
					break;		
					case 'youtube':
						adapter.log.debug('Switching to Youtube App on WebOS TV: ' + adapter.config.IP);
						sendCommand('ssap://system.launcher/launch', {id: "youtube.leanback.v4"}), function (err, val) {
							if (!err) adapter.setState('launch', state.val, true);
						}
					break;			
					default:
						adapter.log.debug(state.val + 'is not a launching app. Opening in Browser on WebOS TV: ' + adapter.config.IP);
						sendCommand('ssap://system.launcher/open', {target: state.val}), function (err, val) {
							if (!err) adapter.setState('launch', state.val, true);
						}
					break;
				}
				break;

			case 'channel':
				adapter.log.debug('Sending switch to channel ' + state.val + ' command to WebOS TV: ' + adapter.config.IP);
				sendCommand('ssap://tv/openChannel', {channelNumber: state.val}, function (err, val) {
					if (!err) adapter.setState('channel', !!state.val, true);
				});
				break;
				//...
			default:
				break;
		}
	}
});

adapter.on('ready', main);

function main() 
{
	adapter.log.info('Ready. Configured WebOS TV IP: ' + adapter.config.IP);
    adapter.subscribeStates('*');
	if (parseInt(adapter.config.interval, 10)) {
		pollTimer = setInterval(pollChannel, parseInt(adapter.config.interval, 10));
	}
}
