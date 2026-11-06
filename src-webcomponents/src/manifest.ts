/**
 * The manifest of `<iob-lgtv-remote>`. Read by the build only (`vite.config.ts`), which writes it as
 * `lgtv-remote.json` next to the module - a host reads that file for its palette and its settings without loading
 * the module.
 *
 * All words come from the devices widget "Control TV": the name and the description from `common.deviceWidgets` in
 * `io-package.json`, the labels of the settings from `src-devices/src/i18n/`. The build reads them.
 */
import type { WebComponentManifest, WebComponentText } from '@iobroker/web-components';

// with the extension: `vite.config.ts` imports this file, and Vite may load its config natively
import { MODULE_FILE, TAG } from './constants.ts';

export { DEVICE_WORDS, DEVICES_WIDGET, MANIFEST_FILE, MODULE_FILE, MODULE_PATH, TAG } from './constants.ts';

/** The words of the devices widget, read by the build */
export interface ManifestTexts {
    /**
     * `label` of the devices widget in `io-package.json`. The same name, per language, makes devices offer the
     * native widget instead of this component
     */
    name: WebComponentText;
    /** `description` of the devices widget in `io-package.json` */
    description: WebComponentText;
    /** A word of the devices widget (`src-devices/src/i18n/`, with the prefix `lgtvremote_`) in every language */
    devices: (key: string) => WebComponentText;
}

/**
 * The manifest with the words of the devices widget
 *
 * @param texts what the build read from `io-package.json` and the dictionary
 */
export function buildManifest(texts: ManifestTexts): WebComponentManifest {
    const { devices } = texts;
    return {
        $schema: 'https://raw.githubusercontent.com/ioBroker/web-components/main/schemas/manifest.json',
        manifestVersion: 1,
        tag: TAG,
        name: texts.name,
        description: texts.description,
        // relative to this file: /adapter/lgtv/dm-widgets/remote.png, the icon of the devices widget
        icon: '../dm-widgets/remote.png',
        module: MODULE_FILE,
        // a tall tile: the whole remote with the default keys; smaller boxes get fewer keys
        size: { width: 280, height: 480 },
        settings: {
            type: 'panel',
            items: {
                instance: {
                    type: 'instance',
                    adapter: 'lgtv',
                    default: 'lgtv.0',
                    label: devices('lgtvremote_instance'),
                },
                showStatus: {
                    type: 'checkbox',
                    default: true,
                    label: devices('lgtvremote_showStatus'),
                },
                showChannel: {
                    type: 'checkbox',
                    default: true,
                    label: devices('lgtvremote_showChannel'),
                },
                showMedia: {
                    type: 'checkbox',
                    default: true,
                    label: devices('lgtvremote_showMedia'),
                },
                showColorKeys: {
                    type: 'checkbox',
                    default: true,
                    label: devices('lgtvremote_showColorKeys'),
                },
                showNumpad: {
                    type: 'checkbox',
                    default: false,
                    label: devices('lgtvremote_showNumpad'),
                },
                name: {
                    type: 'text',
                    label: devices('lgtvremote_name'),
                },
            },
        },
    };
}
