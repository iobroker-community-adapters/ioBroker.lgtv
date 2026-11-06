/**
 * The remote control of an LG WebOS TV as a web component: `<iob-lgtv-remote>` - the web component of the devices
 * widget "Control TV" (`src-devices/src/RemoteControlComponent.tsx`).
 *
 * One module for every host - vis-2, devices, Aura, admin (`@iobroker/web-components`). Its manifest is a file of
 * its own (`lgtv-remote.json`, written by the build from `manifest.ts`), so a host loads this module only when it
 * shows the element. The host sets `socket` and `settings`, and if it has them `theme`, `editMode` and `dialogs`.
 *
 * Everything comes from the instance of the setting, as in the devices widget: a key writes `true` to
 * `lgtv.<n>.remote.<key>` (ack = false) and the adapter sends it to the TV; `remote.power` sends Wake-on-LAN while
 * the TV is off. The header shows `states.on`, `states.volume`, `states.mute` and `states.currentApp`. No `sendTo`.
 *
 * In a small box the element shows a few keys; the button beside the name opens the whole remote in a dialog.
 *
 * React is not in the module: it comes from `lib/esm/react-19.js` beside `adapter/`, see `vite.config.ts`.
 */
import { createRoot, type Root } from 'react-dom/client';

import { defineWebComponent, getThemeCssVariables, IobWebComponent } from '@iobroker/web-components/element';

import { getInstance, STATUS_STATES, TAG, type RemoteSettings } from './constants';
import { getWord, type WordKey } from './i18n';
import { FullView, Hint, RemoteView, type RemoteOptions, type RemoteValues } from './RemoteView';
import { DIALOG_STYLES, STYLES } from './styles';

/** How long a pressed key stays highlighted - the button states are write-only, nothing comes back */
const PRESSED_MS = 180;

/** The height of a row of keys in the dialog */
const DIALOG_ROW_HEIGHT = 46;

class LgTvRemote extends IobWebComponent<RemoteSettings> {
    readonly #root: Root;

    /** The key pressed last, highlighted for `PRESSED_MS` */
    #pressed: string | null = null;

    #pressedTimer: ReturnType<typeof setTimeout> | null = null;

    /** Draws the open dialog again; null while none is open */
    #drawDialog: (() => void) | null = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = STYLES;
        const mount = document.createElement('div');
        mount.className = 'mount';
        shadow.append(style, mount);
        this.#root = createRoot(mount);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        if (this.#pressedTimer) {
            clearTimeout(this.#pressedTimer);
            this.#pressedTimer = null;
        }
        this.#pressed = null;
    }

    protected override getStateIds(settings: RemoteSettings): string[] {
        const instance = getInstance(settings.instance);
        return instance ? STATUS_STATES.map(name => `${instance}.states.${name}`) : [];
    }

    /** Sends a key to the TV: `true` to `remote.<key>`. Nothing in edit mode */
    #press = (key: string): void => {
        const instance = getInstance(this.settings.instance);
        if (this.editMode || !instance) {
            return;
        }
        void this.setState(`${instance}.remote.${key}`, true);
        this.#pressed = key;
        if (this.#pressedTimer) {
            clearTimeout(this.#pressedTimer);
        }
        this.#pressedTimer = setTimeout(() => {
            this.#pressedTimer = null;
            this.#pressed = null;
            this.render();
        }, PRESSED_MS);
        this.render();
    };

    #getOptions(): RemoteOptions {
        const settings = this.settings;
        return {
            showStatus: settings.showStatus !== false,
            showChannel: settings.showChannel !== false,
            showMedia: settings.showMedia !== false,
            showColorKeys: settings.showColorKeys !== false,
            showNumpad: settings.showNumpad === true,
        };
    }

    #getValues(instance: string, word: (key: WordKey) => string): RemoteValues {
        const val = (name: (typeof STATUS_STATES)[number]): ioBroker.StateValue | undefined =>
            this.states[`${instance}.states.${name}`]?.val;
        const on = val('on');
        const volume = val('volume');
        const muted = val('mute');
        const app = val('currentApp');
        return {
            name: this.settings.name || word('title'),
            on: on === null || on === undefined ? null : !!on,
            volume: volume === null || volume === undefined || volume === '' ? null : Number(volume),
            muted: muted === null || muted === undefined ? null : !!muted,
            // "com.webos.app.livetv" -> "livetv": the whole reverse-domain ID is noise on a tile
            app: app ? String(app).split('.').pop() || '' : '',
        };
    }

    #onMore = (): void => {
        if (!this.editMode && !this.#drawDialog) {
            void this.#openFullRemote();
        }
    };

    /** The whole remote in an element dialog of the host, drawn again with every change of a state */
    async #openFullRemote(): Promise<void> {
        const word = (key: WordKey): string => getWord(this.systemLang, key);
        const element = document.createElement('div');
        // the host moves the content into its dialog, out of this element: it takes the theme along
        for (const [name, value] of Object.entries(getThemeCssVariables(this.theme))) {
            element.style.setProperty(name, value);
        }
        const shadow = element.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = DIALOG_STYLES;
        const mount = document.createElement('div');
        mount.className = 'dialog';
        shadow.append(style, mount);
        const root = createRoot(mount);
        this.#drawDialog = () => {
            const instance = getInstance(this.settings.instance);
            if (instance) {
                root.render(
                    <div className="remote single">
                        <FullView
                            values={this.#getValues(instance, word)}
                            options={this.#getOptions()}
                            pressed={this.#pressed}
                            word={word}
                            onPress={this.#press}
                            rowHeight={DIALOG_ROW_HEIGHT}
                        />
                    </div>,
                );
            }
        };
        this.#drawDialog();
        try {
            await this.openDialog({ title: word('fullRemote'), element, width: 360 });
        } finally {
            this.#drawDialog = null;
            root.unmount();
        }
    }

    protected override render(): void {
        const settings = this.settings;
        const word = (key: WordKey): string => getWord(this.systemLang, key);
        const instance = getInstance(settings.instance);

        if (!instance) {
            this.#root.render(
                <Hint
                    text={word(settings.instance ? 'notInstance' : 'chooseInstance')}
                    editMode={this.editMode}
                />,
            );
        } else if (this.objects[`${instance}.states.on`] === null) {
            // read and not there: the instance does not exist (any more)
            this.#root.render(
                <Hint
                    text={`${word('notInstance')}: ${instance}`}
                    editMode={this.editMode}
                />,
            );
        } else {
            this.#root.render(
                <RemoteView
                    values={this.#getValues(instance, word)}
                    options={this.#getOptions()}
                    pressed={this.#pressed}
                    editMode={this.editMode}
                    word={word}
                    onPress={this.#press}
                    onMore={this.#onMore}
                />,
            );
        }
        this.#drawDialog?.();
    }
}

defineWebComponent(TAG, LgTvRemote);
