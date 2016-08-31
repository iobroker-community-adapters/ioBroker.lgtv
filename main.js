"use strict";
var utils = require(__dirname + '/lib/utils');
var adapter = utils.adapter('lgtv');

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

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) 
{
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    if (state) 
	{
		adapter.log.info('Connecting to: ' + adapter.config.IP);
		var lgtvobj = require("lgtv2")({url: 'ws://' + adapter.config.IP + ':3000', timeout: adapter.config.timeout, reconnect: adapter.config.reconnect});
		lgtvobj.on('connect', function () 
		{
			switch(id)
			{
				case adapter.namespace + ".popup":
					adapter.log.info('Connected to: ' + adapter.config.IP + ' for popup message "' + state.val + '"');
					lgtvobj.request('ssap://system.notifications/createToast', {message: state.val});
				break;
				lgtvobj.disconnect();
				default:
				break;
			}
		});
	}
    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        // ??? adapter.log.info('ack is not set!');
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    adapter.log.info('creating state "popup"');
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

function main() {
    adapter.log.info('ready. configured WebOS TV IP: ' + adapter.config.IP);
    adapter.subscribeStates('*');
	




    // the variable testVariable is set to true as command (ack=false)
    //adapter.setState('popup', "test");
    // same thing, but the value is flagged "ack"
    // ack should be always set to true if the value is received from or acknowledged from the target system
    //adapter.setState('testVariable', {val: true, ack: true});
    // same thing, but the state is deleted after 30s (getState will return null afterwards)

    // TEST: adapter.setState('popup', {val: 'test2', ack: true, expire: 30});
}