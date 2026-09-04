# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`iobroker.lgtv` is an ioBroker adapter that controls an **LG WebOS SmartTV** (2013 models and newer) over the TV's SSAP WebSocket API. It mirrors volume, channel, current app, input, sound output and picture settings into ioBroker states, exposes the remote-control buttons as `remote.*` states, and wakes a switched-off TV with Wake-on-LAN.

TypeScript (CommonJS output). Sources live in `src/`, the published/runnable code is the compiled `build/` (`package.json` `main` is `build/main.js`). `build/` is gitignored — always run the build before starting the adapter or the tests.

## Commands

```bash
npm run build                             # tsc -p tsconfig.build.json  -> build/
npm run watch                             # same in watch mode
npm run check                             # type check only (tsconfig.json, noEmit)
npm run lint                              # eslint (@iobroker/eslint-config, flat config)
npx eslint -c eslint.config.mjs --fix .   # autofix + prettier formatting

npm run test:js                           # unit tests for src/lib (needs a build first)
npm run test:package                      # validates package.json / io-package.json / admin JSON (fast)
npm run test:integration                  # starts a real js-controller + adapter instance
npm run translate                         # translate-adapter -b admin/i18n/en.json
npm run release-patch                     # moves the README changelog into io-package news
```

There is deliberately **no `prepare` script** — `npm ci`/`npm install` does not build. Run `npm run build` yourself after a fresh checkout, before starting the adapter and before `npm run test:js` (it requires `build/lib/probe.js`). Because `build/` is neither committed nor built on install, `common.nogit` is `true` in `io-package.json`: the adapter can only be installed from npm, not from GitHub. The integration test aborts with "JS-Controller is already running!" if one is running on the machine.

## Architecture

### Layout

| Path | Content |
| --- | --- |
| `src/main.ts` | the whole adapter: one `LgTv extends utils.Adapter` class |
| `src/lib/types.ts` | shapes of the SSAP responses that are actually consumed |
| `src/lib/probe.ts` | `probeTcpReachable` — TCP liveness probe used by the reconnect watchdog |
| `src/lib/adapter-config.d.ts` | augments `ioBroker.AdapterConfig` |
| `admin/jsonConfig.json` | the configuration dialog |
| `admin/i18n/<lang>.json` | flat translation files, keyed by the `label`s in `jsonConfig.json` |

`src/lib/adapter-config.d.ts` is hand-maintained and must be kept in sync with `native` in `io-package.json` **and** with `admin/jsonConfig.json` — nothing generates it.

The adapter has no `onMessage` handler, so `common.messagebox` is not set and there is no documented `sendTo` API.

### Transport: lgtv2 v2

`lgtv2` is an **ESM-only** package while this build is CommonJS (the compact-mode export at the bottom of `main.ts` needs `module.exports`). The constructor is therefore pulled in with a dynamic `import()` inside `connect()`, and only the *type* is imported statically with `with { 'resolution-mode': 'import' }`. Do not change `module`/`moduleResolution` away from `Node16` — that would rewrite the `import()` to `require()` and the adapter would die at runtime with `ERR_REQUIRE_ESM`. After a build, `grep -n "import(" build/main.js` must still find it.

Details that bite:

- The v1 `wsconfig` option block is still accepted by v2 as a deprecated alias, but **`dropConnectionOnKeepaliveTimeout` is silently discarded** — v2 always drops a dead connection so its own reconnect can take over. The options are passed flat.
- The TV uses a self-signed certificate. `rejectUnauthorized: false` is passed per connection; lgtv2 applies it to the control socket *and* the pointer input socket. There must be no process-wide TLS bypass (`NODE_TLS_REJECT_UNAUTHORIZED`) — that is what got compact mode disabled in 2.7.4.
- `request(uri, cb)` resolves to the `request(uri, payload?)` **promise** overload, which types the callback as a payload object. Always pass the empty payload explicitly: `request(uri, {}, cb)`. `subscribe(uri, cb)` is fine.
- `lgtv.connect` is an instance property, not a prototype method, so passing it detached to `setTimeout` works.
- `disconnect()` returns a promise that only ever resolves.

### Command helpers

`sendCommand(cmd, payload, cb)` → `sendPacket()`. A `cmd` containing `ssap:` or `com.` goes through `lgtv.request()`; everything else (`button`, `move`, `scroll`, `click`) goes through the **pointer input socket** from `getSocket()`. The pointer socket is fire-and-forget — `sendPacket` acks optimistically with `{ returnValue: true }`. `sendCommand` is a no-op while disconnected.

### Reconnect watchdog

`checkReconnectWatchdog()` recreates the LGTV instance when no `connecting` event was seen for `WATCHDOG_STUCK_MS` (60 s) while disconnected, gated behind a TCP probe of port 3001 so a switched-off TV does not produce warnings.

It was written for lgtv2 **v1**, whose `websocket@1` transport could hang in the handshake without ever emitting `connectFailed`. v2 covers that case itself (`handshakeTimeout` 10 s → `connectFailed` → reconnect after 5 s), so the watchdog can no longer fire for its original reason. It is kept only as a generic last resort — if you touch reconnect handling, consider whether it (plus `src/lib/probe.ts` and `test/probe.js`) still earns its place.

### Picture settings

Writes cannot use `ssap://settings/setSystemSettings` — it is not exposed publicly. Instead `setPictureSetting()` creates a **system alert** carrying the real `luna://com.webos.settingsservice/setSystemSettings` URI in its `onClick`/`onclose`/`onfail` handlers, then closes the alert immediately so no popup is visible.

- Reads use one `subscribe` **per key**; bundling keys kills the whole subscription on TVs that lack one of them.
- `justScan` writes go to the `aspectRatio` category, everything else to `picture` (`setCategoryFor`).
- `eyeComfortMode` is exposed as a `boolean` state but Luna expects `'on'`/`'off'` — mapped in `pictureBoolToLuna` / `coercePictureValue`.
- webOS blocks *reads* of `pictureMode`, `colorTemperature`, `eyeComfortMode` and `justScan`, so those four are effectively write-only.

### Health poll tri-state

`healthInterval` is deliberately `ioBroker.Interval | undefined | false`. `false` means "the TV reports its state reliably, never poll again" and is different from `undefined` ("no timer right now"). This comes from the JavaScript original — do not collapse it into a plain handle.

### Wake-on-LAN

`wakeTv()` reads `states.mac` and falls back to `config.mac`, because `states.mac` is only filled after the first successful connection. `wol.wake()` **throws synchronously** on a malformed MAC and the promise it returns rejects *in addition to* calling the callback — both are handled, and both would otherwise take the adapter down. The admin dialog validates the MAC format as well.

## Devices widget (`src-devices/`)

`common.deviceWidgets` in `io-package.json` registers the **Control TV** remote for the
ioBroker.devices adapter. The widget is a Module Federation remote (`DevicesWidgetLgTvSet`,
entry `customDevices.js`) built with Vite and copied to `admin/dm-widgets/` by `tasks.ts`.

```bash
npm run build-devices     # npm install + vite build + copy to admin/dm-widgets
npm run check-devices     # tsc for the widget - vite strips types WITHOUT checking them
cd src-devices && npm start   # standalone dev harness against a js-controller on :8081
```

- **`admin/dm-widgets/` is committed** (like ioBroker.ping does it), so CI and `npm pack` never
  have to run Vite. Re-run `npm run build-devices` whenever something under `src-devices/`
  changes, and commit the result.
- `tasks.ts` sets `process.execArgv = []` before forking. Without it tsx's loader bootstrap is
  inherited by the forked Vite, which then loads `vite.config.ts` as CommonJS and dies with
  `define_import_meta_default.resolve is not a function`.
- The widget imports React/MUI from `@iobroker/dm-widgets`, never from `react`/`@mui/material`
  directly, so it shares the host's instances. It uses only `Box` and `Typography` — the
  smallest set the host is guaranteed to bridge — and draws every key as a text glyph rather
  than depending on a particular MUI icon being exposed.
- Keys write `true` to `lgtv.<n>.remote.<key>` with ack=false; status comes from
  `states.on`, `states.volume`, `states.mute` and `states.currentApp`. Everything is derived
  from the configured instance, so the widget needs **no `sendTo` handler** in the adapter.
- Widget translations live in `src-devices/src/i18n/<lang>.json` (keys prefixed
  `lgtvremote_`) and are separate from the admin translations in `admin/i18n/`.
- The README screenshots in `docs/` are produced from `src-devices/preview.html`, which renders
  all three layouts with canned state (no js-controller needed). Serve it with
  `cd src-devices && npx vite --port 3199` and screenshot the `[data-shot]` elements. The
  preview mirrors two things the host normally provides: the `render()` size dispatch and a
  representative `getTileStyles` (the packaged one is a stub returning `{}`).
- Tile wrappers set `boxSizing: 'border-box'` explicitly and grids use `minmax(0, 1fr)`. Both
  matter: the host's CssBaseline would supply border-box, but relying on it made the tile
  overflow its own cell, and a bare `1fr` is `minmax(auto, 1fr)`, which let the square keys
  blow the track out and clipped the last column.

## Conventions

- Timers always via `this.setTimeout` / `this.setInterval` (adapter-core cleans them up on unload), never the globals.
- Object IDs, state roles, `native` field names and defaults are a public contract — changing them breaks existing installations.
- Changelog goes into `README.md` under `### **WORK IN PROGRESS**`; never edit `common.news` or the version by hand, the release script does that.

## Release

`compact` is currently `false` in `io-package.json`. It was disabled in 2.7.4 because of the process-wide `process.env` TLS bypass; that bypass is gone, so compact mode can be re-enabled once it has been verified on a real installation.
