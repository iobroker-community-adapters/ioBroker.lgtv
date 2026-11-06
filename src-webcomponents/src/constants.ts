/** Tag of the custom element; a host checks that the module defines exactly this one */
export const TAG = 'iob-lgtv-remote';

/** The built module, next to its manifest */
export const MODULE_FILE = 'lgtv-remote.js';

/** The manifest the build writes next to the module; `common.webComponents` names this one */
export const MANIFEST_FILE = 'lgtv-remote.json';

/** Where `tasks.ts` puts the module in the admin folder; the React import is relative to it */
export const MODULE_PATH = `webcomponents/${MODULE_FILE}`;

/** The devices widget whose name, description and words the component takes over (`common.deviceWidgets`) */
export const DEVICES_WIDGET = 'RemoteControlComponent';

/**
 * The states of `lgtv.<n>.states.` the remote shows: those of the devices widget, plus `powerState` and `input` for
 * the status panel of the whole remote, as the remote tab of the admin (`src-admin/src/RemoteControl.tsx`) shows them
 */
export const STATUS_STATES = ['on', 'powerState', 'volume', 'mute', 'currentApp', 'input'] as const;

/** `states.powerState` values that mean the panel may be dark but the TV is running - as in the admin remote */
export const POWER_ON_STATES: readonly string[] = ['on', 'screen_off', 'screen_saver'];

/**
 * The words of the devices widget (`src-devices/src/i18n/`, without the prefix `lgtvremote_`) the element shows.
 * The build picks them out of the dictionary in every language, see `vite.config.ts`.
 */
export const DEVICE_WORDS = [
    'title',
    'power',
    'up',
    'down',
    'left',
    'right',
    'ok',
    'back',
    'home',
    'menu',
    'exit',
    'info',
    'volumeUp',
    'volumeDown',
    'mute',
    'channelUp',
    'channelDown',
    'play',
    'pause',
    'stop',
    'rewind',
    'fastForward',
    'list',
    'qmenu',
    'myApps',
    'muted',
    'online',
    'offline',
    'unknown',
] as const;

export type DeviceWordKey = (typeof DEVICE_WORDS)[number];

/**
 * The words of the remote tab of the admin (`src-admin/src/i18n/`, without the prefix `lgtvadmin_`) the status panel
 * shows. The build picks them out like the words of the devices widget.
 */
export const ADMIN_WORDS = [
    'status',
    'tv',
    'powerState',
    'currentApp',
    'input',
    'volume',
    'ps_on',
    'ps_screen_off',
    'ps_screen_saver',
    'ps_standby',
    'ps_off',
] as const;

export type AdminWordKey = (typeof ADMIN_WORDS)[number];

/** The values of the settings of the manifest; a setting without a value is missing */
export type RemoteSettings = {
    /** Instance of the lgtv adapter: `lgtv.0` (JSON-Config), also `system.adapter.lgtv.0` */
    instance?: string;
    /** Shown in the header instead of "LG TV" */
    name?: string;
    /**
     * The status: volume, mute and the running app below the name; in the whole remote, where there is room, the
     * status panel instead - power state, app, input and a volume slider
     */
    showStatus?: boolean;
    /** Channel up/down and info next to the volume keys */
    showChannel?: boolean;
    /** Rewind, play, pause, stop, fast forward */
    showMedia?: boolean;
    /** The four colour keys */
    showColorKeys?: boolean;
    /** The keys 0-9 */
    showNumpad?: boolean;
};

/**
 * The adapter instance a setting names
 *
 * @param instance `lgtv.0` or `system.adapter.lgtv.0`
 * @returns `lgtv.0`, or null if the setting names no instance of lgtv
 */
export function getInstance(instance: string | undefined): string | null {
    const match = (instance || '').trim().match(/^(?:system\.adapter\.)?(lgtv\.\d+)$/);
    return match ? match[1] : null;
}
