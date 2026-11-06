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

/** The states of `lgtv.<n>.states.` the remote shows - the same as the devices widget */
export const STATUS_STATES = ['on', 'volume', 'mute', 'currentApp'] as const;

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

/** The values of the settings of the manifest; a setting without a value is missing */
export type RemoteSettings = {
    /** Instance of the lgtv adapter: `lgtv.0` (JSON-Config), also `system.adapter.lgtv.0` */
    instance?: string;
    /** Shown in the header instead of "LG TV" */
    name?: string;
    /** Volume, mute and the running app below the name */
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
