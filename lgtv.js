/*
DEV NOTES:

lgtvobj.request('ssap://system/turnOff');	// TV ausschalten
lgtvobj.request('ssap://audio/setMute', {mute: true});		// Lautlos ein
lgtvobj.request('ssap://audio/setMute', {mute: false});		// Lautlos aus
lgtvobj.request('ssap://audio/volumeUp');		// Lautstarke hoher
lgtvobj.request('ssap://audio/volumeDown');		// Lautstarke niedriger
lgtvobj.request('ssap://com.webos.service.tv.display/set3DOn');	// 3D Modus einschalten
lgtvobj.request('ssap://com.webos.service.tv.display/set3DOff');	// 3D Modus ausschalten
lgtvobj.request('ssap://tv/openChannel', {channelNumber: 1});	// Sender wechseln, hier Kanal 1
lgtvobj.request('ssap://tv/switchInput', {inputId: "SCART_1"});	// Eingang umschalten: AV_1, SCART_1 (Scart), COMP_1 (Component) , HDMI_1 (HDMI 1), HDMI_2 (HDMI 2), HDMI_3 (HDMI 3)
lgtvobj.request('ssap://system.launcher/open', {target: "http://www.google.de"});	// Browser offnen
lgtvobj.request('ssap://system.launcher/launch', {id: "com.webos.app.livetv"});	// Auf Live TV umschalten
lgtvobj.request('ssap://system.launcher/launch', {id: "com.webos.app.smartshare"});	// Smartshare App offnen
lgtvobj.request('ssap://system.launcher/launch', {id: "com.webos.app.tvuserguide"});	// TV Bedienungsanleitungs App offnen
lgtvobj.request('ssap://system.launcher/launch', {id: "netflix"});	// Netflix offnen
lgtvobj.request('ssap://system.launcher/launch', {id: "youtube.leanback.v4"});	// Youtube offnen
lgtvobj.request('ssap://tv/getCurrentChannel', function (Error, Response)	// Aktueller Sender (Response nach "channelNumber" filtern!!!!)
*/

'use strict';
var fs 				= require('fs'); // for storing client key
//var WebSocketClient = require('websocket').client; // for communication with TV
//var EventEmitter 	= require('events').EventEmitter;
var utils 			= require(__dirname + '/lib/utils');
var adapter 		= utils.adapter('lgtv');
var LGTV            = require('lgtv2');
var pollTimer       = null;

// BF: Looks OK. Why?

/* IS THAT HERE CORRECT???
var SpecializedSocket = function (ws) {
    SpecializedSocket.send = function(type, payload) {
        payload = payload || {};
        var message =
            Object.keys(payload)
                .reduce(function(acc, k) {
                    return acc.concat([k + ':' + payload[k]]);
                }, ['type:' + type])
                .join('\n') + '\n\n';

        ws.send(message);
    };

    SpecializedSocket.close = function() {
        ws.close();
    };
};
*/

// BF: Is it not better to open the connection and hold it ON? So will always know if TV is ON or OFF? And we do not need time to establish the connection.
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
					if (!err) adapter.setState('popup', state.val, true);
				});
				break;

			case 'mute':
				adapter.log.debug('Sending mute ' + state.val + ' command to WebOS TV: ' + adapter.config.IP);
				sendCommand('ssap://audio/setMute', {mute: !!state.val}, function (err, val) {
					if (!err) adapter.setState('mute', !!state.val, true);
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
