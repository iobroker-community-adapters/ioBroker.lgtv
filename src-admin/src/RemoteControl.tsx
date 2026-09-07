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
}

export default class RemoteControl extends ConfigGeneric<ConfigGenericProps, RemoteControlState> {
    private subscribed: string[] = [];
    private pressTimer: ReturnType<typeof setTimeout> | null = null;

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
        ];
    }

    async componentDidMount(): Promise<void> {
        await super.componentDidMount();

        const ids = this.watchedIds;

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
    }

    private onStateChange = (id: string, state: ioBroker.State | null | undefined): void => {
        this.applyState(id, state);
    };

    private applyState(id: string, state: ioBroker.State | null | undefined): void {
        if (!state) {
            return;
        }
        const key = id.split('.').pop();
        switch (key) {
            case 'on':
                this.setState({ on: !!state.val });
                break;

            case 'powerState':
                this.setState({ powerState: state.val ? String(state.val) : null });
                break;

            case 'volume': {
                const volume = state.val == null ? null : Number(state.val);
                // Ignore the echo of our own write while the slider is still being dragged.
                if (this.state.volumeDraft === null) {
                    this.setState({ volume: volume !== null && Number.isFinite(volume) ? volume : null });
                }
                break;
            }

            case 'mute':
                this.setState({ muted: !!state.val });
                break;

            case 'currentApp':
                this.setState({ currentApp: state.val ? String(state.val) : '' });
                break;

            case 'input':
                this.setState({ input: state.val ? String(state.val) : '' });
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%', maxWidth: 320 }}>
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
                </Box>
            </Box>
        );
    }
}
