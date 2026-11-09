// LG WebOS TV remote control for the adapter's own admin configuration dialog.
//
// It is a jsonConfig `type: "custom"` component, so it lives inside the settings dialog but has
// nothing to do with the settings: it talks to the running instance over the admin socket and
// writes the very same states an ioBroker script would.
//
//     lgtv.<instance>.remote.<key>        boolean, write-only button - 54 keys
//     lgtv.<instance>.states.on           boolean, read-only - true while the TV runs
//     lgtv.<instance>.states.powerState   string, read-only  - on/screen_off/screen_saver/standby/off
//     lgtv.<instance>.states.volume       number, read/write
//     lgtv.<instance>.states.mute         boolean, read/write
//     lgtv.<instance>.states.currentApp   string, read-only
//     lgtv.<instance>.states.input        string, read-only here
//     lgtv.<instance>.tv.app              string, write - an app of the type-detector list (YOUTUBE, ...)
//     lgtv.<instance>.tv.input            string, write - an input of the type-detector list (HDMI1, ...)
//
// The app and input buttons come from `common.states` of tv.app / tv.input, which the instance fills
// with what the TV reported.
//
// Everything is derived from the instance the dialog was opened for, so no `sendTo` handler is
// needed in the adapter. Key presses are immediate and independent of the dialog's Save button -
// they are state writes, not configuration changes.

import React from 'react';

import { Alert, Box, Chip, Divider, Paper, Slider, Typography } from '@mui/material';

// Must come from the package root, not from a child path - see the adapter template.
// Nothing is imported from `@iobroker/gui-components` on purpose: `ConfigGeneric.getText()`
// already resolves keys through I18n, and every module listed as a federation `shared` gets a
// full fallback bundle emitted next to the remote - gui-components alone is 7.3 MB of it.
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';

/** The four coloured function keys, in the order LG prints them. */
const COLOR_KEYS: { key: string; color: string }[] = [
    { key: 'red', color: '#d5342d' },
    { key: 'green', color: '#2e9b4f' },
    { key: 'yellow', color: '#e0b42c' },
    { key: 'blue', color: '#2f6fd0' },
];

/** `states.powerState` values that mean the panel may be dark but the TV is running. */
const POWER_ON_STATES = new Set(['on', 'screen_off', 'screen_saver']);

/** Brand-like colors of the app buttons - text only, no logos */
const APP_COLORS: Record<string, string> = {
    YOUTUBE: '#ff0000',
    YOUTUBE_MUSIC: '#ff0000',
    NETFLIX: '#e50914',
    DISNEY_PLUS: '#113ccf',
    PRIME_VIDEO: '#00a8e1',
    APPLE_TV: '#000000',
    SPOTIFY: '#1db954',
    TWITCH: '#9146ff',
    PLEX: '#e5a00d',
};

/** Keyboard keys that work while the remote has the focus → `remote.<key>` */
const KEYBOARD: Record<string, string> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Enter: 'enter',
    Backspace: 'back',
    Escape: 'exit',
    Home: 'home',
    '+': 'volumeUp',
    '-': 'volumeDown',
    m: 'mute',
    ' ': 'play',
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
};

/** How long after the TV came on its apps and inputs are read again - the instance learns them on connect */
const CHOICES_RELOAD_MS = 5000;

/** One entry of `common.states` of tv.app / tv.input */
type Choice = { id: string; label: string };

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'dash', '0', 'flashback'];
const NUMPAD_LABELS: Record<string, string> = { dash: '–', flashback: '↺' };

interface RemoteControlState extends ConfigGenericState {
    /** `states.on` - null until the first value arrives */
    on: boolean | null;
    powerState: string | null;
    volume: number | null;
    muted: boolean | null;
    currentApp: string | null;
    input: string | null;
    /** Volume while the slider is being dragged, so it does not fight the TV's own updates */
    volumeDraft: number | null;
    /** Key that was pressed last, for the short press highlight */
    pressed: string | null;
    /** `common.states` of tv.app / tv.input */
    apps: Choice[];
    inputs: Choice[];
    /** Current values of tv.app / tv.input */
    tvApp: string;
    tvInput: string;
}

export default class RemoteControl extends ConfigGeneric<ConfigGenericProps, RemoteControlState> {
    private subscribed: string[] = [];
    private pressTimer: ReturnType<typeof setTimeout> | null = null;
    private reloadTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            on: null,
            powerState: null,
            volume: null,
            muted: null,
            currentApp: null,
            input: null,
            volumeDraft: null,
            pressed: null,
            apps: [],
            inputs: [],
            tvApp: '',
            tvInput: '',
        };
    }

    /** `lgtv.0` - the instance whose settings dialog we are rendered in. */
    private get instanceId(): string {
        return `${this.props.oContext.adapterName}.${this.props.oContext.instance}`;
    }

    private get watchedIds(): string[] {
        return [
            `${this.instanceId}.states.on`,
            `${this.instanceId}.states.powerState`,
            `${this.instanceId}.states.volume`,
            `${this.instanceId}.states.mute`,
            `${this.instanceId}.states.currentApp`,
            `${this.instanceId}.states.input`,
            `${this.instanceId}.tv.app`,
            `${this.instanceId}.tv.input`,
        ];
    }

    async componentDidMount(): Promise<void> {
        await super.componentDidMount();

        const ids = this.watchedIds;
        await this.loadChoices();

        // Read once so the panel is populated even if nothing changes while it is open, then
        // subscribe. Both go through the admin socket, which is already connected here.
        await Promise.all(
            ids.map(async id => {
                try {
                    const state = await this.props.oContext.socket.getState(id);
                    this.applyState(id, state);
                } catch {
                    // state does not exist yet (instance never ran) - the panel shows "unknown"
                }
            }),
        );

        try {
            await this.props.oContext.socket.subscribeState(ids, this.onStateChange);
            this.subscribed = ids;
        } catch (e) {
            console.error(`Cannot subscribe to ${this.instanceId}: ${e as string}`);
        }
    }

    componentWillUnmount(): void {
        super.componentWillUnmount?.();
        if (this.subscribed.length) {
            this.props.oContext.socket.unsubscribeState(this.subscribed, this.onStateChange);
            this.subscribed = [];
        }
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
            this.reloadTimer = null;
        }
    }

    /** The apps and inputs the instance offers in tv.app / tv.input */
    private async loadChoices(): Promise<void> {
        const read = async (id: string): Promise<Choice[]> => {
            try {
                const obj = await this.props.oContext.socket.getObject(`${this.instanceId}.${id}`);
                const states = obj?.common?.states;
                if (states && typeof states === 'object' && !Array.isArray(states)) {
                    return Object.entries(states as Record<string, string>).map(([key, label]) => ({
                        id: key,
                        label,
                    }));
                }
            } catch {
                // the instance never ran - no buttons
            }
            return [];
        };
        const [apps, inputs] = await Promise.all([read('tv.app'), read('tv.input')]);
        this.setState({ apps, inputs });
    }

    private onStateChange = (id: string, state: ioBroker.State | null | undefined): void => {
        this.applyState(id, state);
    };

    private applyState(id: string, state: ioBroker.State | null | undefined): void {
        if (!state) {
            return;
        }
        // relative to the instance: `states.input` and `tv.input` must not be mixed up
        const key = id.substring(this.instanceId.length + 1);
        switch (key) {
            case 'states.on':
                if (state.val && this.state.on === false) {
                    // switched on while the dialog is open: the instance reads apps and inputs again
                    if (this.reloadTimer) {
                        clearTimeout(this.reloadTimer);
                    }
                    this.reloadTimer = setTimeout(() => {
                        this.reloadTimer = null;
                        void this.loadChoices();
                    }, CHOICES_RELOAD_MS);
                }
                this.setState({ on: !!state.val });
                break;

            case 'states.powerState':
                this.setState({ powerState: state.val ? String(state.val) : null });
                break;

            case 'states.volume': {
                const volume = state.val == null ? null : Number(state.val);
                // Ignore the echo of our own write while the slider is still being dragged.
                if (this.state.volumeDraft === null) {
                    this.setState({ volume: volume !== null && Number.isFinite(volume) ? volume : null });
                }
                break;
            }

            case 'states.mute':
                this.setState({ muted: !!state.val });
                break;

            case 'states.currentApp':
                this.setState({ currentApp: state.val ? String(state.val) : '' });
                break;

            case 'states.input':
                this.setState({ input: state.val ? String(state.val) : '' });
                break;

            case 'tv.app':
                this.setState({ tvApp: state.val ? String(state.val) : '' });
                break;

            case 'tv.input':
                this.setState({ tvInput: state.val ? String(state.val) : '' });
                break;

            default:
                break;
        }
    }

    /** Write `true` to a `remote.<key>` button state (ack=false - it is a command). */
    private press(key: string): void {
        void this.props.oContext.socket.setState(`${this.instanceId}.remote.${key}`, true, false);
        // The button states are write-only, so nothing comes back - fake the feedback.
        this.setState({ pressed: key });
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
        }
        this.pressTimer = setTimeout(() => {
            this.pressTimer = null;
            this.setState({ pressed: null });
        }, 180);
    }

    /** Write an app / input of the type-detector list to tv.app / tv.input (ack=false - a command) */
    private choose(state: 'app' | 'input', id: string): void {
        void this.props.oContext.socket.setState(`${this.instanceId}.tv.${state}`, id, false);
    }

    private onKeyDown = (e: React.KeyboardEvent): void => {
        const key = KEYBOARD[e.key];
        if (!key || !this.props.alive || e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }
        // arrows and space would scroll the dialog, Backspace would navigate back in some browsers
        e.preventDefault();
        this.press(key);
    };

    private setVolume(value: number): void {
        void this.props.oContext.socket.setState(`${this.instanceId}.states.volume`, value, false);
    }

    /** One remote key. A styled Box rather than a Button, so the glyphs stay square and dense. */
    private renderKey(
        key: string,
        label: React.ReactNode,
        opts?: { color?: string; fontSize?: string; title?: string },
    ): React.JSX.Element {
        const isPressed = this.state.pressed === key;
        const disabled = !this.props.alive;
        return (
            <Box
                key={key}
                component="button"
                disabled={disabled}
                title={opts?.title || key}
                onClick={() => this.press(key)}
                sx={theme => ({
                    all: 'unset',
                    boxSizing: 'border-box',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: opts?.color || (isPressed ? theme.palette.action.selected : theme.palette.action.hover),
                    color: opts?.color ? '#fff' : theme.palette.text.primary,
                    opacity: disabled ? 0.45 : 1,
                    fontSize: opts?.fontSize || '0.95rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    userSelect: 'none',
                    transform: isPressed ? 'scale(0.92)' : 'none',
                    transition: 'transform 0.08s ease, background-color 0.15s ease',
                    '&:hover': disabled ? {} : { bgcolor: opts?.color || theme.palette.action.selected },
                })}
            >
                {label}
            </Box>
        );
    }

    private static renderGrid(columns: number, children: React.ReactNode, maxWidth?: number): React.JSX.Element {
        return (
            <Box
                sx={{
                    display: 'grid',
                    // minmax(0, 1fr) and not a bare 1fr: the square keys would otherwise blow the
                    // track out and clip the last column, same as in the devices widget.
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap: 0.75,
                    width: '100%',
                    maxWidth,
                    mx: maxWidth ? 'auto' : undefined,
                }}
            >
                {children}
            </Box>
        );
    }

    /** Power is coloured, because it is the one key that also works while the TV is off. */
    private renderPowerKey(): React.JSX.Element {
        return this.renderKey('power', '⏻', {
            color: this.state.on ? '#b3382f' : '#3f7d46',
            fontSize: '1.2rem',
            title: this.getText('lgtvadmin_power'),
        });
    }

    private renderDPad(): React.JSX.Element {
        return RemoteControl.renderGrid(
            3,
            [
                <Box key="tl" />,
                this.renderKey('up', '▲', { title: this.getText('lgtvadmin_up') }),
                <Box key="tr" />,
                this.renderKey('left', '◀', { title: this.getText('lgtvadmin_left') }),
                this.renderKey('enter', 'OK', { fontSize: '0.8rem', title: this.getText('lgtvadmin_ok') }),
                this.renderKey('right', '▶', { title: this.getText('lgtvadmin_right') }),
                <Box key="bl" />,
                this.renderKey('down', '▼', { title: this.getText('lgtvadmin_down') }),
                <Box key="br" />,
            ],
            210,
        );
    }

    private renderRemote(): React.JSX.Element {
        return (
            <Box
                tabIndex={0}
                onKeyDown={this.onKeyDown}
                title={this.getText('lgtvadmin_keyboard')}
                sx={theme => ({
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    width: '100%',
                    maxWidth: 320,
                    borderRadius: '8px',
                    outline: 'none',
                    '&:focus-visible': { boxShadow: `0 0 0 2px ${theme.palette.primary.main}` },
                })}
            >
                {RemoteControl.renderGrid(4, [
                    this.renderPowerKey(),
                    this.renderKey('list', '≡', { title: this.getText('lgtvadmin_list') }),
                    this.renderKey('qmenu', 'Q', { title: this.getText('lgtvadmin_qmenu') }),
                    this.renderKey('myApps', '⊞', { title: this.getText('lgtvadmin_myApps') }),
                ])}
                {this.renderDPad()}
                {RemoteControl.renderGrid(4, [
                    this.renderKey('back', '↩', { title: this.getText('lgtvadmin_back') }),
                    this.renderKey('home', '⌂', { title: this.getText('lgtvadmin_home') }),
                    this.renderKey('menu', '☰', { title: this.getText('lgtvadmin_menu') }),
                    this.renderKey('exit', '✕', { title: this.getText('lgtvadmin_exit') }),
                ])}
                {RemoteControl.renderGrid(6, [
                    this.renderKey('volumeUp', '+', { fontSize: '1.1rem', title: this.getText('lgtvadmin_volumeUp') }),
                    this.renderKey('mute', 'Ø', { title: this.getText('lgtvadmin_mute') }),
                    this.renderKey('volumeDown', '−', {
                        fontSize: '1.1rem',
                        title: this.getText('lgtvadmin_volumeDown'),
                    }),
                    this.renderKey('channelUp', 'CH+', {
                        fontSize: '0.7rem',
                        title: this.getText('lgtvadmin_channelUp'),
                    }),
                    this.renderKey('info', 'ℹ', { title: this.getText('lgtvadmin_info') }),
                    this.renderKey('channelDown', 'CH−', {
                        fontSize: '0.7rem',
                        title: this.getText('lgtvadmin_channelDown'),
                    }),
                ])}
                {RemoteControl.renderGrid(5, [
                    this.renderKey('rewind', '«', { fontSize: '1.15rem', title: this.getText('lgtvadmin_rewind') }),
                    this.renderKey('play', '▶', { title: this.getText('lgtvadmin_play') }),
                    this.renderKey('pause', '⏸', { title: this.getText('lgtvadmin_pause') }),
                    this.renderKey('stop', '■', { title: this.getText('lgtvadmin_stop') }),
                    this.renderKey('fastForward', '»', {
                        fontSize: '1.15rem',
                        title: this.getText('lgtvadmin_fastForward'),
                    }),
                ])}
                {RemoteControl.renderGrid(
                    4,
                    COLOR_KEYS.map(c => this.renderKey(c.key, '', { color: c.color, title: c.key })),
                )}
                {RemoteControl.renderGrid(
                    3,
                    NUMPAD_KEYS.map(k => this.renderKey(k, NUMPAD_LABELS[k] ?? k, { title: k })),
                )}
            </Box>
        );
    }

    /** Text buttons for tv.app / tv.input; the current value is outlined */
    private renderChoices(state: 'app' | 'input', choices: Choice[], current: string): React.JSX.Element {
        const disabled = !this.props.alive;
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
                {choices.map(choice => {
                    const color = state === 'app' ? APP_COLORS[choice.id] : undefined;
                    const active = choice.id === current;
                    return (
                        <Box
                            key={choice.id}
                            component="button"
                            disabled={disabled}
                            title={choice.label}
                            onClick={() => this.choose(state, choice.id)}
                            sx={theme => ({
                                all: 'unset',
                                boxSizing: 'border-box',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                height: 32,
                                px: 1,
                                borderRadius: '16px',
                                border: active
                                    ? `2px solid ${theme.palette.primary.main}`
                                    : `1px solid ${theme.palette.divider}`,
                                bgcolor: color || theme.palette.action.hover,
                                color: color ? '#fff' : theme.palette.text.primary,
                                opacity: disabled ? 0.45 : 1,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                lineHeight: active ? '28px' : '30px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                userSelect: 'none',
                                transition: 'filter 0.12s ease',
                                '&:hover': disabled ? {} : { filter: 'brightness(1.15)' },
                            })}
                        >
                            {choice.label}
                        </Box>
                    );
                })}
            </Box>
        );
    }

    /** Apps and inputs of the channel tv - only shown once the instance created them */
    private renderShortcuts(): React.JSX.Element | null {
        const { apps, inputs, tvApp, tvInput } = this.state;
        if (!apps.length && !inputs.length) {
            return null;
        }
        return (
            <Paper
                variant="outlined"
                sx={{ p: 2, minWidth: 240, flex: '1 1 240px', maxWidth: 400, alignSelf: 'flex-start' }}
            >
                {apps.length ? (
                    <>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1 }}
                        >
                            {this.getText('lgtvadmin_apps')}
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        {this.renderChoices('app', apps, tvApp)}
                    </>
                ) : null}
                {inputs.length ? (
                    <>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, mt: apps.length ? 2 : 0 }}
                        >
                            {this.getText('lgtvadmin_inputs')}
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        {this.renderChoices('input', inputs, tvInput)}
                    </>
                ) : null}
            </Paper>
        );
    }

    private static renderStatusRow(label: string, value: React.ReactNode): React.JSX.Element {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', py: 0.4 }}>
                <Typography
                    variant="body2"
                    sx={{ opacity: 0.7 }}
                >
                    {label}
                </Typography>
                {value}
            </Box>
        );
    }

    /** Read-only status plus the volume slider. */
    private renderStatus(): React.JSX.Element {
        const { on, powerState, volume, muted, currentApp, input, volumeDraft } = this.state;
        // "com.webos.app.livetv" -> "livetv" - the reverse-domain id is noise here.
        const app = currentApp ? currentApp.split('.').pop() : null;
        const running = powerState ? POWER_ON_STATES.has(powerState) : on;
        const shownVolume = volumeDraft ?? volume;

        return (
            <Paper
                variant="outlined"
                sx={{ p: 2, minWidth: 240, flex: '1 1 240px', maxWidth: 400, alignSelf: 'flex-start' }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{ mb: 1 }}
                >
                    {this.getText('lgtvadmin_status')}
                </Typography>
                <Divider sx={{ mb: 1 }} />

                {RemoteControl.renderStatusRow(
                    this.getText('lgtvadmin_tv'),
                    <Chip
                        size="small"
                        label={
                            running === null
                                ? this.getText('lgtvadmin_unknown')
                                : running
                                  ? this.getText('lgtvadmin_online')
                                  : this.getText('lgtvadmin_offline')
                        }
                        color={running ? 'success' : 'default'}
                    />,
                )}
                {powerState
                    ? RemoteControl.renderStatusRow(
                          this.getText('lgtvadmin_powerState'),
                          <Typography variant="body2">{this.getText(`lgtvadmin_ps_${powerState}`)}</Typography>,
                      )
                    : null}
                {app
                    ? RemoteControl.renderStatusRow(
                          this.getText('lgtvadmin_currentApp'),
                          <Typography variant="body2">{app}</Typography>,
                      )
                    : null}
                {input
                    ? RemoteControl.renderStatusRow(
                          this.getText('lgtvadmin_input'),
                          <Typography variant="body2">{input}</Typography>,
                      )
                    : null}

                <Divider sx={{ my: 1 }} />
                <Typography
                    variant="body2"
                    sx={{ opacity: 0.7 }}
                >
                    {this.getText('lgtvadmin_volume')}
                    {shownVolume === null ? '' : `: ${shownVolume}`}
                    {muted ? ` (${this.getText('lgtvadmin_muted')})` : ''}
                </Typography>
                <Slider
                    size="small"
                    min={0}
                    max={100}
                    disabled={!this.props.alive || shownVolume === null}
                    value={shownVolume ?? 0}
                    onChange={(_e, value) => this.setState({ volumeDraft: value })}
                    onChangeCommitted={(_e, value) => {
                        this.setVolume(value);
                        this.setState({ volume: value, volumeDraft: null });
                    }}
                    valueLabelDisplay="auto"
                />
            </Paper>
        );
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        return (
            <Box sx={{ width: '100%' }}>
                {this.props.alive ? null : (
                    <Alert
                        severity="info"
                        sx={{ mb: 2 }}
                    >
                        {this.getText('lgtvadmin_not_alive')}
                    </Alert>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
                    {this.renderRemote()}
                    {this.renderStatus()}
                    {this.renderShortcuts()}
                </Box>
            </Box>
        );
    }
}
