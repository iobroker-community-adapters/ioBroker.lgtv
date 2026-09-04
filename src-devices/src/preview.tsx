// Renders the three widget layouts side by side with canned state, so the documentation
// screenshots can be produced without a running js-controller. Dev-only: this file is not part
// of the Module Federation bundle (only `Components.tsx` and `translations.ts` are exposed).

import './dev-shim';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdapterReact, type IStateContext, type WidgetInfo } from '@iobroker/dm-widgets';

import RemoteControlComponent from './RemoteControlComponent';
import translations from './translations';

const INSTANCE = 'lgtv.0';

/** The state the screenshots should show: TV on, volume 14, watching live TV. */
const CANNED: Record<string, ioBroker.StateValue> = {
    [`${INSTANCE}.states.on`]: true,
    [`${INSTANCE}.states.volume`]: 14,
    [`${INSTANCE}.states.mute`]: false,
    [`${INSTANCE}.states.currentApp`]: 'com.webos.app.livetv',
};

class MockStateContext implements IStateContext {
    defaultHistory: string | null = null;
    instanceId = INSTANCE;
    admin = false;
    language: ioBroker.Languages = 'en';
    longitude: number | null = null;
    latitude: number | null = null;
    isFloatComma = false;
    dateFormat = 'DD.MM.YYYY';
    imagePrefix = '';
    themeType = 'dark' as const;

    getState(id: string, handler: (id: string, state: ioBroker.State) => void): void {
        const val = CANNED[id];
        if (val !== undefined) {
            handler(id, { val, ack: true, ts: Date.now(), .../* rest is unused by the widget */ {} } as ioBroker.State);
        }
    }
    removeState(): void {}
    async getObject<T>(): Promise<T | undefined> {
        return undefined;
    }
    getObjectProperty(): void {}
    async removeObject(): Promise<void> {}
    getImagePath(): string | null {
        return null;
    }
    // Only used on click; the screenshots never press a key.
    getSocket(): any {
        return { setState: (id: string, val: unknown) => console.log('setState', id, val) };
    }
    setCoordinates(): void {}
    destroy(): void {}
}

/**
 * The host supplies the real `WidgetGeneric` through Module Federation. Standalone we get the
 * compile-time stubs, so the few chrome helpers the widget calls are neutralised here.
 */
class PreviewRemote extends RemoteControlComponent {
    protected renderIndicators(): React.JSX.Element | null {
        return null;
    }
    protected renderSettingsButton(): React.JSX.Element | null {
        return null;
    }
    protected getAccentColor(): string | undefined {
        return undefined;
    }
    protected getWidgetClass(): string {
        return 'preview-widget';
    }

    /**
     * The host's `render()` dispatches to renderCompact/renderWide/renderWideTall depending on
     * `settings.size`; the compile-time stub just returns null. Mirror the dispatch so the
     * standalone preview shows the same layout the host would pick.
     */
    render(): React.JSX.Element {
        const size = (this.props.settings as { size?: string }).size;
        if (size === '1x1') {
            return this.renderCompact();
        }
        if (size === '2x0.5') {
            return this.renderWide();
        }
        return this.renderWideTall();
    }
}

const LAYOUTS: Array<{ size: '1x1' | '2x0.5' | '2x2'; caption: string; width: number }> = [
    { size: '1x1', caption: 'Compact (1x1)', width: 180 },
    { size: '2x0.5', caption: 'Wide (2x0.5)', width: 380 },
    { size: '2x2', caption: 'Full remote (2x2)', width: 380 },
];

function Preview(): React.JSX.Element {
    const ctx = React.useMemo(() => new MockStateContext(), []);
    return (
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', padding: 24 }}>
            {LAYOUTS.map(l => (
                <div key={l.size}>
                    <div
                        data-shot={l.size}
                        style={{ width: l.width }}
                    >
                        <PreviewRemote
                            widget={{ id: `preview_${l.size}`, type: 'widget', name: 'LG TV' } as WidgetInfo}
                            stateContext={ctx}
                            settings={{ size: l.size, instance: INSTANCE, name: 'LG TV' } as any}
                            onHide={() => {}}
                        />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.55, fontFamily: 'sans-serif' }}>
                        {l.caption}
                    </div>
                </div>
            ))}
        </div>
    );
}

const I18n = AdapterReact.I18n;
I18n.setTranslations?.(translations);
I18n.setLanguage?.('en');

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(<Preview />);
}
