// Standalone dev harness for `npm run start`. It is NOT part of the federation bundle —
// production loads `Components.tsx` through Module Federation and the host supplies its own
// StateContext. This file only exists so the widget can be developed against a running
// js-controller without deploying it into ioBroker.devices first.

import React, { useEffect, useState } from 'react';
import { Connection, type ThemeType } from '@iobroker/gui-components';
import type {
    IStateContext,
    ObjectChangeListener,
    StateChangeListener,
    WidgetInfo,
} from '@iobroker/dm-widgets';

import RemoteControlComponent from './RemoteControlComponent';

/**
 * Minimal IStateContext implementation that routes getState/removeState to a real
 * `@iobroker/socket-client` Connection. Fan-out per ID is handled locally so the
 * same state can have multiple subscribers.
 */
class DevStateContext implements IStateContext {
    private handlers = new Map<string, Set<StateChangeListener>>();
    private readonly socket: Connection;

    defaultHistory: string | null = null;
    instanceId = '';
    admin = false;
    language: ioBroker.Languages = 'en';
    longitude: number | null = null;
    latitude: number | null = null;
    isFloatComma = true;
    dateFormat = 'DD.MM.YYYY';
    imagePrefix = '../../files/';
    themeType: ThemeType = 'dark';

    constructor(socket: Connection) {
        this.socket = socket;
    }

    setCoordinates(latitude: number | null, longitude: number | null): void {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    getImagePath(fileName: string | null | undefined): string | null {
        if (!fileName) {
            return null;
        }
        if (/^(https?:)?\/\//.test(fileName) || fileName.startsWith('data:')) {
            return fileName;
        }
        return `${this.imagePrefix}${fileName.startsWith('/') ? fileName.slice(1) : fileName}`;
    }

    getState(id: string, handler: StateChangeListener): void {
        let set = this.handlers.get(id);
        if (!set) {
            set = new Set();
            this.handlers.set(id, set);
            void this.socket.subscribeState(id, (sid, state) => {
                const listeners = this.handlers.get(sid);
                if (!listeners || !state) {
                    return;
                }
                for (const cb of listeners) {
                    cb(sid, state);
                }
            });
            void this.socket
                .getState(id)
                .then(state => {
                    if (state) {
                        handler(id, state);
                    }
                })
                .catch(() => {});
        }
        set.add(handler);
    }

    removeState(id: string, handler: StateChangeListener): void {
        const set = this.handlers.get(id);
        if (!set) {
            return;
        }
        set.delete(handler);
        if (set.size === 0) {
            this.socket.unsubscribeState(id);
            this.handlers.delete(id);
        }
    }

    async getObject<T>(id: string): Promise<T | undefined> {
        try {
            return (await this.socket.getObject(id)) as unknown as T;
        } catch {
            return undefined;
        }
    }

    getObjectProperty(_id: string, _property: string, _cb: ObjectChangeListener): void {}
    async removeObject(_id: string, _cb: ObjectChangeListener): Promise<void> {}

    getSocket(): Connection {
        return this.socket;
    }

    destroy(): void {
        for (const id of this.handlers.keys()) {
            this.socket.unsubscribeState(id);
        }
        this.handlers.clear();
    }
}

/**
 * In production the host provides the real `WidgetGeneric` via Module Federation, including
 * `renderIndicators` / `renderSettingsButton` / `getStyle*`. The compile-time stubs in
 * `@iobroker/dm-widgets` return nothing, so the dev harness fills in the few members the
 * widget calls, to keep the standalone render from crashing.
 */
class DevRemote extends RemoteControlComponent {
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
        return 'dev-widget';
    }
}

const SIZES: Array<{ size: '1x1' | '2x0.5' | '2x2'; label: string; width: number }> = [
    { size: '1x1', label: 'Compact (1x1)', width: 190 },
    { size: '2x0.5', label: 'Wide (2x0.5)', width: 400 },
    { size: '2x2', label: 'Full remote (2x2)', width: 400 },
];

const overlayStyle: React.CSSProperties = {
    fontFamily: 'sans-serif',
    padding: 24,
    color: '#ddd',
};

export default function App(): React.JSX.Element {
    const [ctx, setCtx] = useState<DevStateContext | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [instance, setInstance] = useState('lgtv.0');

    useEffect(() => {
        let socket: Connection | null = null;
        try {
            socket = new Connection({
                protocol: 'ws:',
                host: window.location.hostname,
                port: 8081,
                admin5only: false,
                autoSubscribes: [],
                onReady: () => setCtx(new DevStateContext(socket as Connection)),
                onError: (e: unknown) => setError(String(e)),
            } as any);
        } catch (e) {
            setError(String(e));
        }
        return () => {
            socket?.destroy?.();
        };
    }, []);

    if (error) {
        return <div style={{ ...overlayStyle, color: '#ff6b6b' }}>Connection error: {error}</div>;
    }
    if (!ctx) {
        return <div style={overlayStyle}>Connecting to js-controller on :8081 …</div>;
    }

    return (
        <div style={{ ...overlayStyle, background: '#20242a', minHeight: '100vh' }}>
            <label style={{ display: 'block', marginBottom: 16 }}>
                {'Instance: '}
                <input
                    value={instance}
                    onChange={e => setInstance(e.target.value)}
                    style={{ padding: 4 }}
                />
            </label>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {SIZES.map(s => (
                    <div key={s.size}>
                        <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.7 }}>{s.label}</div>
                        <div style={{ width: s.width }}>
                            <DevRemote
                                widget={{ id: `dev_${s.size}`, type: 'widget', name: 'LG TV' } as WidgetInfo}
                                stateContext={ctx}
                                settings={
                                    {
                                        size: s.size,
                                        instance,
                                        name: 'LG TV',
                                    } as any
                                }
                                onHide={() => {}}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
