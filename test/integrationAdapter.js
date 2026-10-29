const assert = require('node:assert');
const path = require('node:path');
const { tests } = require('@iobroker/testing');

const NS = 'lgtv.0';

// Run integration tests - See https://github.com/ioBroker/testing for a detailed explanation and further options
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Type-detector', getHarness => {
            it('detects the channel tv as device type tv', async function () {
                this.timeout(60_000);
                const harness = getHarness();
                // no TV on 127.0.0.1 - the channel tv is created in onReady regardless
                await harness.changeAdapterConfig('lgtv', { native: { ip: '127.0.0.1' } });
                await harness.startAdapterAndWait();
                // the objects are created in onReady, give it a moment
                await new Promise(resolve => setTimeout(resolve, 2000));

                const list = await harness.objects.getObjectListAsync({ startkey: `${NS}.`, endkey: `${NS}.香` });
                const objects = {};
                for (const row of list.rows) {
                    objects[row.id] = row.value;
                }

                const { ChannelDetector } = require('@iobroker/type-detector');
                const controls = new ChannelDetector().detect({
                    objects,
                    id: `${NS}.tv`,
                    _keysOptional: Object.keys(objects),
                    _usedIdsOptional: [],
                });
                assert.ok(controls && controls.length, 'nothing detected');
                const tv = controls.find(control => control.type === 'tv');
                assert.ok(tv, `detected: ${controls.map(control => control.type).join(', ')}`);

                const found = {};
                for (const state of tv.states) {
                    if (state.id) {
                        found[state.name] = state.id.replace(`${NS}.`, '');
                    }
                }
                assert.deepStrictEqual(found, {
                    POWER: 'tv.power',
                    KEY: 'tv.key',
                    VOLUME: 'tv.volume',
                    MUTE: 'tv.muted',
                    VOLUME_UP: 'tv.volumeUp',
                    VOLUME_DOWN: 'tv.volumeDown',
                    INPUT: 'tv.input',
                    APP: 'tv.app',
                    UNREACH: 'tv.unreach',
                });

                // keys of common.states must be a subset of the type-detector lists
                const { TV_KEYS, TV_INPUTS, TV_APPS } = require('@iobroker/type-detector');
                for (const [id, allowed] of [
                    ['tv.key', TV_KEYS],
                    ['tv.input', TV_INPUTS],
                    ['tv.app', TV_APPS],
                ]) {
                    for (const key of Object.keys(objects[`${NS}.${id}`].common.states)) {
                        assert.ok(key in allowed, `${id}: ${key} is not in the type-detector list`);
                    }
                }

                const unreach = await harness.states.getStateAsync(`${NS}.tv.unreach`);
                assert.strictEqual(unreach && unreach.val, true, 'tv.unreach must be true without a TV');
            });
        });

        suite('sendTo', getHarness => {
            it('discover answers with a list for the IP field', async function () {
                this.timeout(60_000);
                const harness = getHarness();
                await harness.changeAdapterConfig('lgtv', { native: { ip: '127.0.0.1' } });
                await harness.startAdapterAndWait();
                const response = await new Promise(resolve => harness.sendTo(NS, 'discover', {}, resolve));
                assert.ok(Array.isArray(response), `unexpected answer ${JSON.stringify(response)}`);
                for (const entry of response) {
                    assert.strictEqual(typeof entry.value, 'string');
                    assert.strictEqual(typeof entry.label, 'string');
                }
            });
        });
    },
});
