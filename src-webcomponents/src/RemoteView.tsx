/**
 * The views of the remote, drawn with plain React into the shadow root - the keys and their glyphs are those of the
 * devices widget (`src-devices/src/RemoteControlComponent.tsx`), the status panel of the whole remote is the one of
 * the remote tab of the admin (`src-admin/src/RemoteControl.tsx`). Which view is shown, and where the panel goes, is
 * decided by container queries, see `styles.ts`.
 */
import { useEffect, useRef, type CSSProperties, type JSX, type ReactNode } from 'react';

import { ADMIN_WORDS, type AdminWordKey } from './constants';
import type { WordKey } from './i18n';

/** What the remote shows, read from `lgtv.<n>.states.` */
export interface RemoteValues {
    /** The setting `name`, else "LG TV" */
    name: string;
    /** `states.on`; null until it has a value */
    on: boolean | null;
    /** `states.powerState`: `on`, `screen_off`, `screen_saver`, `standby` or `off`; null until it has a value */
    powerState: string | null;
    /** Whether the TV runs: by `powerState` if the TV reports one, else by `states.on`; null if neither has a value */
    running: boolean | null;
    /** `states.volume`, or the value of the slider while it is dragged; null until it has a value */
    volume: number | null;
    /** `states.mute`; null until it has a value */
    muted: boolean | null;
    /** The last part of `states.currentApp` - `livetv` of `com.webos.app.livetv`; empty for none */
    app: string;
    /** `states.input` - `HDMI_1`; empty for none */
    input: string;
}

/** Which rows of the whole remote and what of the header are shown - the settings of the devices widget */
export interface RemoteOptions {
    showStatus: boolean;
    showChannel: boolean;
    showMedia: boolean;
    showColorKeys: boolean;
    showNumpad: boolean;
}

interface CommonProps {
    values: RemoteValues;
    options: RemoteOptions;
    /** The key pressed last, highlighted for a moment */
    pressed: string | null;
    word: (key: WordKey) => string;
    /** Writes `true` to `remote.<key>` */
    onPress: (key: string) => void;
    /** The volume slider moves (`done` false) or is let go (`done` true): only then `states.volume` is written */
    onVolume: (value: number, done: boolean) => void;
}

export interface RemoteProps extends CommonProps {
    editMode: boolean;
    /** Shows the whole remote in a dialog of the host */
    onMore: () => void;
}

/** The colour keys, in the order LG prints them */
const COLOR_KEYS: { key: 'red' | 'green' | 'yellow' | 'blue'; color: string }[] = [
    { key: 'red', color: '#d5342d' },
    { key: 'green', color: '#2e9b4f' },
    { key: 'yellow', color: '#e0b42c' },
    { key: 'blue', color: '#2f6fd0' },
];

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'dash', '0', 'flashback'];

/** The glyphs of the number pad keys that are no digit */
const NUMPAD_LABELS: Record<string, string> = { dash: '–', flashback: '↺' };

interface KeyProps {
    /** The key of the remote: `remote.<id>` */
    id: string;
    /** The glyph on the key */
    label: string;
    title: string;
    pressed: string | null;
    onPress: (key: string) => void;
    /** More classes: `text` for a word as label, `power`, `color` */
    className?: string;
    style?: CSSProperties;
}

/** One key of the remote; a text glyph, as in the devices widget */
function Key({ id, label, title, pressed, onPress, className, style }: KeyProps): JSX.Element {
    const classes = ['key'];
    if (className) {
        classes.push(className);
    }
    if (pressed === id) {
        classes.push('pressed');
    }
    return (
        <button
            type="button"
            className={classes.join(' ')}
            title={title}
            aria-label={title}
            style={style}
            onClick={() => onPress(id)}
        >
            <span aria-hidden="true">{label}</span>
        </button>
    );
}

/** A row of keys of equal width */
function Row({ cols, children }: { cols: number; children: ReactNode }): JSX.Element {
    return (
        <div
            className="row"
            style={{ '--cols': cols } as CSSProperties}
        >
            {children}
        </div>
    );
}

/** The volume and mute state and the running app, as the devices widget shows them */
function getStatus(values: RemoteValues, word: (key: WordKey) => string): string {
    const parts: string[] = [];
    const { volume, muted, app } = values;
    if (volume !== null && Number.isFinite(volume)) {
        parts.push(muted ? `${volume} (${word('muted')})` : String(volume));
    } else if (muted) {
        parts.push(word('muted'));
    }
    if (app) {
        parts.push(app);
    }
    return parts.join(' · ');
}

/** The name, the status line and the dot of `states.on`; in the small views a button for the whole remote */
function Header({ values, options, word, onMore }: CommonProps & { onMore?: () => void }): JSX.Element {
    const status = options.showStatus ? getStatus(values, word) : '';
    const { on } = values;
    return (
        <div className="head">
            <div className="titles">
                <div className="name">{values.name}</div>
                {status ? <div className="status">{status}</div> : null}
            </div>
            <span
                className={`dot${on === null ? '' : on ? ' on' : ' off'}`}
                title={word(on === null ? 'unknown' : on ? 'online' : 'offline')}
            />
            {onMore ? (
                <button
                    type="button"
                    className="more"
                    title={word('fullRemote')}
                    aria-label={word('fullRemote')}
                    onClick={onMore}
                >
                    ⋯
                </button>
            ) : null}
        </div>
    );
}

/**
 * The volume slider: shows `volume` and reports every move; it is let go when the browser fires `change` - React's
 * `onChange` is the `input` event of the DOM and fires on every move
 */
function VolumeSlider({
    volume,
    label,
    onVolume,
}: {
    volume: number | null;
    label: string;
    onVolume: (value: number, done: boolean) => void;
}): JSX.Element {
    const ref = useRef<HTMLInputElement>(null);
    // the handler of the element is the same function on every render, so the listener is added once
    useEffect(() => {
        const input = ref.current;
        if (!input) {
            return undefined;
        }
        const onDone = (): void => onVolume(Number(input.value), true);
        input.addEventListener('change', onDone);
        return () => input.removeEventListener('change', onDone);
    }, [onVolume]);
    return (
        <input
            ref={ref}
            className="slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume ?? 0}
            disabled={volume === null}
            aria-label={label}
            title={label}
            onChange={e => onVolume(Number(e.currentTarget.value), false)}
        />
    );
}

/** One line of the status panel: a label and its value */
function Fact({ label, children }: { label: string; children: ReactNode }): JSX.Element {
    return (
        <div className="fact">
            <span className="label">{label}</span>
            <span className="value">{children}</span>
        </div>
    );
}

/** The power state in words: `screen_off` -> "Screen off" */
function getPowerState(powerState: string, word: (key: WordKey) => string): string {
    const key = `ps_${powerState}`;
    return (ADMIN_WORDS as readonly string[]).includes(key) ? word(key as AdminWordKey) : powerState;
}

/**
 * The status panel of the whole remote, as the remote tab of the admin shows it: whether the TV runs, its power
 * state, the running app, the input, and the volume with a slider and the mute state. Above the keys in a tall box,
 * beside them in a wide one (`styles.ts`)
 */
function StatusPanel({ values, word, onVolume }: CommonProps): JSX.Element {
    const { running, powerState, app, input, volume, muted } = values;
    return (
        <div className="panel">
            <div className="panel-title">{word('status')}</div>
            <div className="facts">
                <Fact label={word('tv')}>
                    <span className={`chip${running ? ' on' : ''}`}>
                        {word(running === null ? 'unknown' : running ? 'online' : 'offline')}
                    </span>
                </Fact>
                {powerState ? <Fact label={word('powerState')}>{getPowerState(powerState, word)}</Fact> : null}
                {app ? <Fact label={word('currentApp')}>{app}</Fact> : null}
                {input ? <Fact label={word('input')}>{input}</Fact> : null}
            </div>
            <div className="volume">
                <Fact label={word('volume')}>
                    {volume === null ? '' : volume}
                    {muted ? <span className="chip muted">{word('muted')}</span> : null}
                </Fact>
                <VolumeSlider
                    volume={volume}
                    label={word('volume')}
                    onVolume={onVolume}
                />
            </div>
        </div>
    );
}

/** The power key: green to switch on, red to switch off - `remote.power` sends Wake-on-LAN while the TV is off */
function PowerKey({ values, pressed, word, onPress }: CommonProps): JSX.Element {
    return (
        <Key
            id="power"
            label="⏻"
            title={word('power')}
            className={values.on ? 'power on' : 'power'}
            pressed={pressed}
            onPress={onPress}
        />
    );
}

/** The number of rows of the whole remote below the header */
export function getFullRows(options: RemoteOptions): number {
    // power row, the three rows of the arrows, back/home/menu/exit, volume and channel
    let rows = 6;
    if (options.showMedia) {
        rows++;
    }
    if (options.showColorKeys) {
        rows++;
    }
    if (options.showNumpad) {
        rows += 4;
    }
    return rows;
}

/**
 * The whole remote
 *
 * @param props what to show
 * @param props.rowHeight the height of a row of keys in a dialog; in the box of the host they share its height
 */
export function FullView(props: CommonProps & { rowHeight?: number }): JSX.Element {
    const { options, pressed, word, onPress, rowHeight } = props;
    const rows = getFullRows(options);
    // `status`: the panel is there, the container queries decide whether it is shown; with more rows of keys it
    // needs a taller box (`rows-l`) than with the default ones (`rows-s`)
    const classes = ['view', 'full'];
    if (options.showStatus) {
        classes.push('status', rows > 8 ? 'rows-l' : 'rows-s');
    }
    const key = (id: string, label: string, title: WordKey, className?: string): JSX.Element => (
        <Key
            key={id}
            id={id}
            label={label}
            title={word(title)}
            className={className}
            pressed={pressed}
            onPress={onPress}
        />
    );
    const track = rowHeight ? `${rowHeight}px` : 'minmax(24px, 56px)';

    return (
        <div
            className={classes.join(' ')}
            style={{ '--rows': rows, '--track': track } as CSSProperties}
        >
            <Header {...props} />
            {options.showStatus ? <StatusPanel {...props} /> : null}
            <Row cols={4}>
                <PowerKey {...props} />
                {key('list', '≡', 'list')}
                {key('qmenu', 'Q', 'qmenu')}
                {key('myApps', '⊞', 'myApps')}
            </Row>
            <div className="dpad">
                <span />
                {key('up', '▲', 'up')}
                <span />
                {key('left', '◀\uFE0E', 'left')}
                {key('enter', 'OK', 'ok', 'text')}
                {key('right', '▶\uFE0E', 'right')}
                <span />
                {key('down', '▼', 'down')}
                <span />
            </div>
            <Row cols={4}>
                {key('back', '↩\uFE0E', 'back')}
                {key('home', '⌂', 'home')}
                {key('menu', '☰', 'menu')}
                {key('exit', '✕', 'exit')}
            </Row>
            <Row cols={options.showChannel ? 6 : 3}>
                {key('volumeUp', '+', 'volumeUp')}
                {key('mute', 'Ø', 'mute')}
                {key('volumeDown', '−', 'volumeDown')}
                {options.showChannel
                    ? [
                          key('channelUp', 'CH+', 'channelUp', 'text'),
                          key('info', 'ℹ\uFE0E', 'info'),
                          key('channelDown', 'CH−', 'channelDown', 'text'),
                      ]
                    : null}
            </Row>
            {options.showMedia ? (
                <Row cols={5}>
                    {key('rewind', '«', 'rewind')}
                    {key('play', '▶\uFE0E', 'play')}
                    {key('pause', '⏸\uFE0E', 'pause')}
                    {key('stop', '■', 'stop')}
                    {key('fastForward', '»', 'fastForward')}
                </Row>
            ) : null}
            {options.showColorKeys ? (
                <Row cols={4}>
                    {COLOR_KEYS.map(({ key: id, color }) => (
                        <Key
                            key={id}
                            id={id}
                            label=""
                            title={word(id)}
                            className="color"
                            style={{ '--key-color': color } as CSSProperties}
                            pressed={pressed}
                            onPress={onPress}
                        />
                    ))}
                </Row>
            ) : null}
            {options.showNumpad ? (
                <div className="numpad">
                    {NUMPAD_KEYS.map(id => (
                        <Key
                            key={id}
                            id={id}
                            label={NUMPAD_LABELS[id] ?? id}
                            title={id === 'dash' || id === 'flashback' ? word(id) : id}
                            pressed={pressed}
                            onPress={onPress}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

/** The header and six keys, for a small tile */
function CompactView(props: CommonProps & { onMore: () => void }): JSX.Element {
    const { pressed, word, onPress } = props;
    return (
        <div className="view compact">
            <Header {...props} />
            <div className="keys">
                <PowerKey {...props} />
                <Key
                    id="volumeUp"
                    label="+"
                    title={word('volumeUp')}
                    pressed={pressed}
                    onPress={onPress}
                />
                <Key
                    id="volumeDown"
                    label="−"
                    title={word('volumeDown')}
                    pressed={pressed}
                    onPress={onPress}
                />
                <Key
                    id="home"
                    label="⌂"
                    title={word('home')}
                    pressed={pressed}
                    onPress={onPress}
                />
                <Key
                    id="enter"
                    label="OK"
                    title={word('ok')}
                    className="text"
                    pressed={pressed}
                    onPress={onPress}
                />
                <Key
                    id="mute"
                    label="Ø"
                    title={word('mute')}
                    pressed={pressed}
                    onPress={onPress}
                />
            </div>
        </div>
    );
}

/** The header and five keys in one row, for a flat bar */
function StripView(props: CommonProps & { onMore: () => void }): JSX.Element {
    const { pressed, word, onPress } = props;
    return (
        <div className="view strip">
            <Header {...props} />
            <div className="keys">
                <PowerKey {...props} />
                <Key
                    id="volumeDown"
                    label="−"
                    title={word('volumeDown')}
                    pressed={pressed}
                    onPress={onPress}
                />
                <Key
                    id="mute"
                    label="Ø"
                    title={word('mute')}
                    pressed={pressed}
                    onPress={onPress}
                />
                <Key
                    id="volumeUp"
                    label="+"
                    title={word('volumeUp')}
                    pressed={pressed}
                    onPress={onPress}
                />
                <Key
                    id="home"
                    label="⌂"
                    title={word('home')}
                    pressed={pressed}
                    onPress={onPress}
                />
            </div>
        </div>
    );
}

/** The remote in the box of the host: all three views, the container queries show the one that fits */
export function RemoteView(props: RemoteProps): JSX.Element {
    const { editMode, onMore, ...common } = props;
    return (
        <div className={`remote auto${editMode ? ' edit' : ''}`}>
            <FullView {...common} />
            <CompactView
                {...common}
                onMore={onMore}
            />
            <StripView
                {...common}
                onMore={onMore}
            />
        </div>
    );
}

/** A remote: the picture of the hint */
const REMOTE_PATH =
    'M15 9H9c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V10c0-.55-.45-1-1-1m-3 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2M7.05 6.05l1.41 1.41C9.37 6.56 10.62 6 12 6s2.63.56 3.54 1.46l1.41-1.41C15.68 4.78 13.93 4 12 4s-3.68.78-4.95 2.05M12 0C8.96 0 6.21 1.23 4.22 3.22l1.41 1.41C7.26 3.01 9.51 2 12 2s4.74 1.01 6.36 2.64l1.41-1.41C17.79 1.23 15.04 0 12 0';

/**
 * A hint instead of the remote: the instance is missing or is none of lgtv
 *
 * @param props the text and whether the host is in edit mode
 * @param props.text what to say
 * @param props.editMode in edit mode the element takes no clicks
 */
export function Hint({ text, editMode }: { text: string; editMode: boolean }): JSX.Element {
    return (
        <div className={`hint${editMode ? ' edit' : ''}`}>
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d={REMOTE_PATH} />
            </svg>
            <span>{text}</span>
        </div>
    );
}
