'use strict';
var fs 				= require('fs'); // for storing client key
var utils 			= require(__dirname + '/lib/utils');
var adapter 		= utils.adapter('lgtv2011');
var LGTV			= require('node-lgtv-api/api.js');
var pollTimerChannel = null;


/*function pollChannel() {
	adapter.log.debug('Polling channel');
	sendCommand(TV_CMD_POWER, [], function (err, val) 
	{
		if (!err) 
			adapter.setState('turnOff', state.val, true);
	});

	sendCommand('ssap://tv/getCurrentChannel', null, function (err, channel) 
	{
		var JSONChannel, ch;
		JSONChannel = JSON.stringify(channel);
		adapter.log.debug('DEBUGGING CHANNEL POLLING PROBLEM: ' + JSONChannel);
		if (JSONChannel) ch = JSONChannel.match(/"channelNumber":"(\d+)"/m);
		if (!err && ch) 
		{
			adapter.setState('channel', ch[1], true);
		} 
		else 
		{
			adapter.setState('channel', '', true);
		}
	});
}*/

function RequestPairingKey(ip, port) 
{
	adapter.log.info('Requesting Pairing Key on TV: ' + adapter.config.ip);

	var lgtvobj = new LGTV(adapter.config.ip, adapter.config.port);
	lgtvobj.displayPairingKey(function (err) 
	{
		if (err) adapter.log.error('ERROR: ' + err);
    })
}

adapter.on('stateChange', function (id, state)
{
    if (id && state && !state.ack)
	{
		id = id.substring(adapter.namespace.length + 1);
		switch (id)
		{
			case 'turnOff':
				var lgtvobj = new LGTV(adapter.config.ip, adapter.config.port, adapter.config.pairingkey);
				adapter.log.debug('Starting state change "' + id + '", value "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
				lgtvobj.authenticate(function (err, sessionKey) {
					adapter.log.debug('Sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					if (err) 
						adapter.log.error('ERROR on sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					else 
					{
						adapter.log.debug('Sending turn off message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
						lgtvobj.processCommand(lgtvobj.TV_CMD_POWER, [], function (err, data) {
							if (err) 
								adapter.log.error('ERROR on sending turn off message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							else 
							{
								adapter.setState('turnOff', state.val, true);
								adapter.log.debug('Success in sending turn off message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							}
						});
					}
				});
			break;
			
			case 'volumeUp':
//				var lgtvobj = new LGTV(adapter.config.ip, adapter.config.port, adapter.config.pairingkey);
				adapter.log.debug('Starting state change "' + id + '", value "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
/*				lgtvobj.authenticate(function (err, sessionKey) {
					adapter.log.debug('Sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					if (err) 
						adapter.log.error('ERROR on sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					else 
					{
						adapter.log.debug('Sending volumeUp message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
						lgtvobj.processCommand(lgtvobj.TV_CMD_VOLUME_UP, [], function (err, data) {
							if (err) 
								adapter.log.error('ERROR on sending volumeUp message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							else 
							{
								adapter.setState('volumeUp', !!state.val, true);
								adapter.log.debug('Success in sending volumeUp message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							}
						});
					}
				});			
*/

				var tvApi = new LGTV(adapter.config.ip, adapter.config.port, adapter.config.pairingkey);
				tvApi.authenticate(function (err, sessionKey) 
				{
					if (err) 
					{
						adapter.log.error(err);
					} 
					else 
					{
						tvApi.processCommand(tvApi.TV_CMD_NUMBER_1, [], function (err, data) 
						{
							if (err) 
							{
								adapter.log.error(err);
							} 
							else 
							{
								adapter.log.debug(data);
							}
						});
					}
				});


			break;
			
			case 'volumeDown':
				var lgtvobj = new LGTV(adapter.config.ip, adapter.config.port, adapter.config.pairingkey);
				adapter.log.debug('Starting state change "' + id + '", value "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
				lgtvobj.authenticate(function (err, sessionKey) {
					adapter.log.debug('Sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					if (err) 
						adapter.log.error('ERROR on sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					else 
					{
						adapter.log.debug('Sending volumeDown message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
						lgtvobj.processCommand(lgtvobj.TV_CMD_VOLUME_DOWN, [], function (err, data) {
							if (err) 
								adapter.log.error('ERROR on sending volumeDown message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							else 
							{
								adapter.setState('volumeDown', !!state.val, true);
								adapter.log.debug('Success in sending volumeDown message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							}
						});
					}
				});	
			break;
			
			case 'mute':
				var lgtvobj = new LGTV(adapter.config.ip, adapter.config.port, adapter.config.pairingkey);
				adapter.log.debug('Starting state change "' + id + '", value "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
				lgtvobj.authenticate(function (err, sessionKey) {
					adapter.log.debug('Sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					if (err) 
						adapter.log.error('ERROR on sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					else 
					{
						adapter.log.debug('Sending mute message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
						lgtvobj.processCommand(lgtvobj.TV_CMD_MUTE_TOGGLE, [], function (err, data) {
							if (err) 
								adapter.log.error('ERROR on sending mute message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							else 
							{
								adapter.setState('mute', !!state.val, true);
								adapter.log.debug('Success in sending mute message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							}
						});
					}
				});	
			break;
			
			case 'channelUp':
				var lgtvobj = new LGTV(adapter.config.ip, adapter.config.port, adapter.config.pairingkey);
				adapter.log.debug('Starting state change "' + id + '", value "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
				lgtvobj.authenticate(function (err, sessionKey) {
					adapter.log.debug('Sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					if (err) 
						adapter.log.error('ERROR on sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					else 
					{
						adapter.log.debug('Sending channelUp message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
						lgtvobj.processCommand(lgtvobj.TV_CMD_CHANNEL_UP, [], function (err, data) {
							if (err) 
								adapter.log.error('ERROR on sending channelUp message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							else 
							{
								adapter.setState('channelUp', !!state.val, true);
								adapter.log.debug('Success in sending channelUp message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							}
						});
					}
				});				
			break;			

			case 'channelDown':
				var lgtvobj = new LGTV(adapter.config.ip, adapter.config.port, adapter.config.pairingkey);
				adapter.log.debug('Starting state change "' + id + '", value "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
				lgtvobj.authenticate(function (err, sessionKey) {
					adapter.log.debug('Sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					if (err) 
						adapter.log.error('ERROR on sending authentication request with pairing key "' + adapter.config.pairingkey + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
					else 
					{
						adapter.log.debug('Sending channelDown message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
						lgtvobj.processCommand(lgtvobj.TV_CMD_CHANNEL_DOWN, [], function (err, data) {
							if (err) 
								adapter.log.error('ERROR on sending channelDown message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							else 
							{
								adapter.setState('channelDown', !!state.val, true);
								adapter.log.debug('Success in sending channelDown message "' + state.val + '" to LG TV at ' + adapter.config.ip + ' on port ' + adapter.config.port);
							}
						});
					}
				});				
			break;			
		}
	}
});

adapter.on('message', function (obj) 
{
	adapter.log.debug('Incoming Adapter message: ' + obj.command);
    switch (obj.command) 
	{
        case 'RequestPairingKey_Msg':
            if (!obj.callback) return false;
			RequestPairingKey(adapter.config.ip, adapter.config.port);
		return true;
		
        default:
            adapter.log.warn("Unknown command: " + obj.command);
		break;
    }
});

adapter.on('ready', main);

function main() 
{
	adapter.log.info('Ready. Configured LG TV IP: ' + adapter.config.ip);
    adapter.subscribeStates('*');
	if (parseInt(adapter.config.interval, 10)) 
	{
//		pollTimerChannel = setInterval(pollChannel, parseInt(adapter.config.interval, 10));
	}
}