/*
DEV NOTES:

lgtvobj.request('ssap://system/turnOff');	// TV ausschalten
lgtvobj.request('ssap://system.launcher/open', {target: "http://www.google.de"});	// Browser öffnen
lgtvobj.request('ssap://audio/setMute', {mute: true});		// Lautlos ein
lgtvobj.request('ssap://audio/setMute', {mute: false});		// Lautlos aus
lgtvobj.request('ssap://audio/volumeUp');		// Lautstärke höher
lgtvobj.request('ssap://audio/volumeDown');		// Lautstärke niedriger
lgtvobj.request('ssap://com.webos.service.tv.display/set3DOn');	// 3D Modus einschalten
lgtvobj.request('ssap://com.webos.service.tv.display/set3DOff');	// 3D Modus ausschalten
lgtvobj.request('ssap://tv/openChannel', {channelNumber: 1});	// Sender wechseln, hier Kanal 1
lgtvobj.request('ssap://tv/switchInput', {inputId: "SCART_1"});	// Eingang umschalten: AV_1, SCART_1 (Scart), COMP_1 (Component) , HDMI_1 (HDMI 1), HDMI_2 (HDMI 2), HDMI_3 (HDMI 3)
lgtvobj.request('ssap://system.launcher/launch', {id: "com.webos.app.livetv"});	// Auf Live TV umschalten
lgtvobj.request('ssap://system.launcher/launch', {id: "com.webos.app.smartshare"});	// Smartshare App öffnen
lgtvobj.request('ssap://system.launcher/launch', {id: "com.webos.app.tvuserguide"});	// TV Bedienungsanleitungs App öffnen
lgtvobj.request('ssap://system.launcher/launch', {id: "netflix"});	// Netflix öffnen
lgtvobj.request('ssap://system.launcher/launch', {id: "youtube.leanback.v4"});	// Youtube öffnen
lgtvobj.request('ssap://tv/getCurrentChannel', function (Error, Response)	// Aktueller Sender (Response nach "channelNumber" filtern!!!!)
*/

"use strict";
var fs = require('fs'); // for storing client key
var WebSocketClient = require('websocket').client; // for communication with TV
var EventEmitter = require('events').EventEmitter;
var utils = require(__dirname + '/lib/utils');
var adapter = utils.adapter('lgtv');

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

adapter.on('unload', function (callback) 
{
    try 
	{
        adapter.log.info('cleaned everything up...');
        callback();
    } 
	catch (e) 
	{
        callback();
    }
});

adapter.on('stateChange', function (id, state)
{
    if (state && id) 
	{
		var lgtvobj = require("lgtv2")({url: 'ws://' + adapter.config.IP + ':3000', timeout: adapter.config.timeout, reconnect: adapter.config.reconnect});
		lgtvobj.on('connecting', function (Error, Response) 
		{
			adapter.log.info('Connecting to WebOS TV: ' + adapter.config.IP);
			if (Error)
			{
				adapter.log.error('Error on connecting to WebOS TV');
			}
		});
	
		lgtvobj.on('prompt', function () 
		{
			adapter.log.info('Waiting for pairing confirmation on WebOS TV ' + adapter.config.IP);
		});
	
		lgtvobj.on('error', function () 
		{
			adapter.log.error('Error on connecting or sending command to WebOS TV');
		});
	
		lgtvobj.on('connect', function (Error, Response) 
		{
			switch(id)
			{
				case adapter.namespace + ".popup":
					adapter.log.info('Sending popup message "' + state.val + '" to WebOS TV: '  +adapter.config.IP);
					lgtvobj.request('ssap://system.notifications/createToast', {message: state.val}, function (Error, Response) 
					{
						if (!Error && JSON.stringify(Response).match('"returnValue":true'))
						{
							adapter.log.info('Sent popup message "' + state.val + '" to WebOS TV: ' + adapter.config.IP);
						}
						else
						{
							adapter.log.error('ERROR! Response from TV: ' + JSON.stringify(Response));
							lgtvobj.disconnect();
						}
						lgtvobj.disconnect();
					});
				break;
		
				default:
					lgtvobj.disconnect();
				break;
			}
			if (Error)
				lgtvobj.disconnect();
		});
	}
});

adapter.on('ready', function () {
    adapter.log.info('Creating state "popup"');
    adapter.setObject('popup', {
        type: 'state',
        common: {
            name: 'popup',
            type: 'string',
            role: 'indicator'
        },
        native: {}
    });

    main();
});

function main() 
{
	adapter.log.info('Ready. Configured WebOS TV IP: ' + adapter.config.IP);
    adapter.subscribeStates('*');
}