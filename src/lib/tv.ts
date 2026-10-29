import type { ExternalInput, LaunchPoint } from './types';

/**
 * Channel `tv` for the device type `tv` of the ioBroker type-detector (@iobroker/type-detector >= 6.2.0), parallel
 * to the existing `states.*` and `remote.*` objects. Keys of `common.states` of `key`, `input` and `app` come from
 * `TV_KEYS` / `TV_INPUTS` / `TV_APPS` of the type-detector - only these keys are allowed, the labels are the ones
 * of the type-detector.
 */

/** `TV_KEYS` of the type-detector → button name of the pointer input socket */
export const TV_KEY_BUTTONS: Record<string, { label: string; button: string }> = {
    UP: { label: 'Up', button: 'UP' },
    DOWN: { label: 'Down', button: 'DOWN' },
    LEFT: { label: 'Left', button: 'LEFT' },
    RIGHT: { label: 'Right', button: 'RIGHT' },
    SELECT: { label: 'Select', button: 'ENTER' },
    BACK: { label: 'Back', button: 'BACK' },
    EXIT: { label: 'Exit', button: 'EXIT' },
    HOME: { label: 'Home', button: 'HOME' },
    MENU: { label: 'Menu', button: 'MENU' },
    INFO: { label: 'Info', button: 'INFO' },
    GUIDE: { label: 'Guide', button: 'GUIDE' },
    CHANNEL_UP: { label: 'Channel up', button: 'CHANNELUP' },
    CHANNEL_DOWN: { label: 'Channel down', button: 'CHANNELDOWN' },
    NUMBER_0: { label: '0', button: '0' },
    NUMBER_1: { label: '1', button: '1' },
    NUMBER_2: { label: '2', button: '2' },
    NUMBER_3: { label: '3', button: '3' },
    NUMBER_4: { label: '4', button: '4' },
    NUMBER_5: { label: '5', button: '5' },
    NUMBER_6: { label: '6', button: '6' },
    NUMBER_7: { label: '7', button: '7' },
    NUMBER_8: { label: '8', button: '8' },
    NUMBER_9: { label: '9', button: '9' },
    PLAY: { label: 'Play', button: 'PLAY' },
    PAUSE: { label: 'Pause', button: 'PAUSE' },
    STOP: { label: 'Stop', button: 'STOP' },
    REWIND: { label: 'Rewind', button: 'REWIND' },
    FAST_FORWARD: { label: 'Fast forward', button: 'FASTFORWARD' },
    RED: { label: 'Red', button: 'RED' },
    GREEN: { label: 'Green', button: 'GREEN' },
    YELLOW: { label: 'Yellow', button: 'YELLOW' },
    BLUE: { label: 'Blue', button: 'BLUE' },
};

/** Input id of `TV`: not an external input, it is reached by launching the live TV app */
export const LIVE_TV_INPUT = 'livetv';
export const LIVE_TV_APP = 'com.webos.app.livetv';

/** `TV_INPUTS` of the type-detector → input id of `ssap://tv/switchInput`, used until the TV sent its list */
export const DEFAULT_TV_INPUTS: Record<string, { label: string; id: string }> = {
    TV: { label: 'TV', id: LIVE_TV_INPUT },
    HDMI1: { label: 'HDMI 1', id: 'HDMI_1' },
    HDMI2: { label: 'HDMI 2', id: 'HDMI_2' },
    HDMI3: { label: 'HDMI 3', id: 'HDMI_3' },
    HDMI4: { label: 'HDMI 4', id: 'HDMI_4' },
};

/** `TV_INPUTS` with a pattern for the id the TV reports in `getExternalInputList` and for its input app */
const TV_INPUT_IDS: { key: string; label: string; id: RegExp; app: RegExp }[] = [
    { key: 'HDMI1', label: 'HDMI 1', id: /^HDMI_1$/, app: /\.hdmi1$/ },
    { key: 'HDMI2', label: 'HDMI 2', id: /^HDMI_2$/, app: /\.hdmi2$/ },
    { key: 'HDMI3', label: 'HDMI 3', id: /^HDMI_3$/, app: /\.hdmi3$/ },
    { key: 'HDMI4', label: 'HDMI 4', id: /^HDMI_4$/, app: /\.hdmi4$/ },
    { key: 'AV', label: 'AV', id: /^AV_\d$/, app: /\.av\d$/ },
    { key: 'COMPONENT', label: 'Component', id: /^COMP_\d$/, app: /\.comp\d$/ },
    { key: 'SCART', label: 'SCART', id: /^SCART_\d$/, app: /\.scart\d$/ },
];

/** The inputs of the TV that are one of `TV_INPUTS`: key → label and input id. `TV` is always there */
export function matchTvInputs(devices: ExternalInput[]): Record<string, { label: string; id: string }> {
    const result: Record<string, { label: string; id: string }> = { TV: DEFAULT_TV_INPUTS.TV };
    for (const device of devices) {
        const found = TV_INPUT_IDS.find(entry => entry.id.test(device.id));
        if (found && !result[found.key]) {
            result[found.key] = { label: found.label, id: device.id };
        }
    }
    return result;
}

/** Key of `TV_INPUTS` for the foreground app (`com.webos.app.hdmi1` → `HDMI1`), or '' for any other app */
export function inputForApp(appId: string, inputs: Record<string, { label: string; id: string }>): string {
    if (appId === LIVE_TV_APP) {
        return inputs.TV ? 'TV' : '';
    }
    const found = TV_INPUT_IDS.find(entry => entry.app.test(appId));
    return found && inputs[found.key] ? found.key : '';
}

/** App ids of `TV_APPS` on webOS, used until the TV sent its launch points */
export const DEFAULT_TV_APPS: Record<string, { label: string; id: string }> = {
    YOUTUBE: { label: 'YouTube', id: 'youtube.leanback.v4' },
    NETFLIX: { label: 'Netflix', id: 'netflix' },
    PRIME_VIDEO: { label: 'Prime Video', id: 'amazon' },
    BROWSER: { label: 'Browser', id: 'com.webos.app.browser' },
};

/** `TV_APPS` with a pattern for the title the TV reports in `listLaunchPoints` */
const TV_APP_NAMES: { key: string; label: string; pattern: RegExp }[] = [
    { key: 'YOUTUBE_MUSIC', label: 'YouTube Music', pattern: /^youtube ?music/ },
    { key: 'YOUTUBE', label: 'YouTube', pattern: /^youtube/ },
    { key: 'NETFLIX', label: 'Netflix', pattern: /^netflix/ },
    { key: 'DISNEY_PLUS', label: 'Disney+', pattern: /^disney/ },
    { key: 'PRIME_VIDEO', label: 'Prime Video', pattern: /prime ?video|^amazon/ },
    { key: 'APPLE_TV', label: 'Apple TV', pattern: /^apple ?tv/ },
    { key: 'MAX', label: 'Max', pattern: /^(hbo ?)?max$/ },
    { key: 'PARAMOUNT_PLUS', label: 'Paramount+', pattern: /^paramount/ },
    { key: 'DAZN', label: 'DAZN', pattern: /^dazn/ },
    { key: 'WOW', label: 'WOW', pattern: /^wow\b/ },
    { key: 'JOYN', label: 'Joyn', pattern: /^joyn/ },
    { key: 'RTL_PLUS', label: 'RTL+', pattern: /^rtl ?(\+|plus)/ },
    { key: 'MAGENTA_TV', label: 'MagentaTV', pattern: /^magenta ?tv/ },
    { key: 'ARD_MEDIATHEK', label: 'ARD Mediathek', pattern: /^ard mediathek/ },
    { key: 'ZDF_MEDIATHEK', label: 'ZDF Mediathek', pattern: /^zdf/ },
    { key: 'SPOTIFY', label: 'Spotify', pattern: /^spotify/ },
    { key: 'TWITCH', label: 'Twitch', pattern: /^twitch/ },
    { key: 'PLEX', label: 'Plex', pattern: /^plex/ },
    { key: 'BROWSER', label: 'Browser', pattern: /browser$|^web ?browser|^internet$/ },
];

/** The apps of the TV that are one of `TV_APPS`: key → label and app id */
export function matchTvApps(points: LaunchPoint[]): Record<string, { label: string; id: string }> {
    const result: Record<string, { label: string; id: string }> = {};
    for (const point of points) {
        const title = String(point.title || '')
            .trim()
            .toLowerCase();
        const found = TV_APP_NAMES.find(entry => entry.pattern.test(title));
        if (found && !result[found.key]) {
            result[found.key] = { label: found.label, id: point.id };
        }
    }
    return result;
}

/** `common.states` of a key → { label } map */
export function labels(map: Record<string, { label: string }>): Record<string, string> {
    return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, value.label]));
}

/** Objects of the channel `tv`, relative to the namespace */
export const TV_OBJECTS: Record<string, ioBroker.SettableChannelObject | ioBroker.SettableStateObject> = {
    tv: {
        type: 'channel',
        common: { name: 'TV (type-detector)' },
        native: {},
    },
    'tv.power': {
        type: 'state',
        common: { name: 'Power', type: 'boolean', role: 'switch.power', read: true, write: true, def: false },
        native: {},
    },
    'tv.key': {
        type: 'state',
        common: {
            name: 'Remote key',
            type: 'string',
            role: 'media.key',
            read: false,
            write: true,
            states: labels(TV_KEY_BUTTONS),
        },
        native: {},
    },
    'tv.volume': {
        type: 'state',
        common: {
            name: 'Volume',
            type: 'number',
            role: 'level.volume',
            read: true,
            write: true,
            min: 0,
            max: 100,
            def: 0,
        },
        native: {},
    },
    'tv.muted': {
        type: 'state',
        common: { name: 'Muted', type: 'boolean', role: 'media.mute', read: true, write: true, def: false },
        native: {},
    },
    'tv.volumeUp': {
        type: 'state',
        common: { name: 'Volume up', type: 'boolean', role: 'button.volume.up', read: false, write: true },
        native: {},
    },
    'tv.volumeDown': {
        type: 'state',
        common: { name: 'Volume down', type: 'boolean', role: 'button.volume.down', read: false, write: true },
        native: {},
    },
    'tv.input': {
        type: 'state',
        common: {
            name: 'Input',
            type: 'string',
            role: 'media.input',
            read: true,
            write: true,
            states: labels(DEFAULT_TV_INPUTS),
        },
        native: {},
    },
    'tv.app': {
        type: 'state',
        common: {
            name: 'App',
            type: 'string',
            role: 'media.app',
            read: true,
            write: true,
            states: labels(DEFAULT_TV_APPS),
        },
        native: {},
    },
    'tv.unreach': {
        type: 'state',
        common: {
            name: 'TV not reachable',
            type: 'boolean',
            role: 'indicator.maintenance.unreach',
            read: true,
            write: false,
            def: true,
        },
        native: {},
    },
};
