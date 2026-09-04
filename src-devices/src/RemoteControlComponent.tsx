// LG WebOS TV remote-control widget for ioBroker.devices.
//
// Data source: the lgtv adapter exposes every physical remote key as a button state
//
//     lgtv.<instance>.remote.<key>        (boolean, write-only button — 54 keys)
//     lgtv.<instance>.states.on           (boolean, read-only — true while the TV runs)
//     lgtv.<instance>.states.volume       (number)
//     lgtv.<instance>.states.mute         (boolean)
//     lgtv.<instance>.states.currentApp   (string — e.g. "com.webos.app.livetv")
//
// Pressing a key writes `true` to `remote.<key>` with ack=false; the adapter forwards it to
// the TV over the pointer-input socket. `remote.power` is special: the adapter sends the POWER
// button while the TV is on and a Wake-on-LAN packet while it is off, so one button toggles.
//
// Everything is derived from the configured instance, so the widget needs no `sendTo` handler
// in the adapter — the id layout is fixed by io-package.json.

import WidgetGeneric, {
    React,
    MuiMaterial,
    getTileStyles,
    isNeumorphicTheme,
    AdapterReact,
    type WidgetGenericProps,
    type WidgetGenericState,
    type CustomWidgetPlugin,
} from '@iobroker/dm-widgets';
import type { BoxProps, TypographyProps } from '@mui/material';
// `WidgetGeneric.getConfigSchema()` declares its return via dm-utils' copy of these types, so the
// override signature has to use the same source, while the literal is authored against the richer
// json-config types — same split as the ping widgets.
import type { ConfigItemPanel, ConfigItemTabs } from '@iobroker/dm-utils';
import type { ConfigItemPanel as JsonConfigItemPanel } from '@iobroker/json-config';
import type { I18n as I18nType, Icon as IconType } from '@iobroker/gui-components';

// Pull components from the host-shared bridge rather than importing `@mui/material` directly, so
// this widget shares the host's React/MUI instances. We deliberately use only `Box` and
// `Typography` — the smallest set the host is guaranteed to bridge. Every key is a styled `Box`
// with a text glyph, so the widget does not depend on any particular MUI icon being exposed.
const Box: React.ComponentType<BoxProps> = MuiMaterial?.Box;
const Typography: React.ComponentType<TypographyProps> = MuiMaterial?.Typography;
const I18n = AdapterReact.I18n as typeof I18nType;
const Icon = AdapterReact.Icon as typeof IconType;

/** Colour of the four coloured function keys, in the order LG prints them. */
const COLOR_KEYS: { key: string; color: string }[] = [
    { key: 'red', color: '#d5342d' },
    { key: 'green', color: '#2e9b4f' },
    { key: 'yellow', color: '#e0b42c' },
    { key: 'blue', color: '#2f6fd0' },
];

interface RemoteControlSettings extends CustomWidgetPlugin {
    /** lgtv adapter instance, e.g. "lgtv.0". */
    instance?: string;
    /** Show the 0-9 number pad. */
    showNumpad?: boolean;
    /** Show the four coloured function keys. */
    showColorKeys?: boolean;
    /** Show the media transport row (rewind / play / pause / stop / forward). */
    showMedia?: boolean;
    /** Show the channel up/down keys next to the volume keys. */
    showChannel?: boolean;
    /** Show volume value and mute state under the header. */
    showStatus?: boolean;
}

interface RemoteControlState extends WidgetGenericState {
    /** `states.on` — null until the first sample arrives. */
    on: boolean | null;
    /** `states.volume` */
    volume: number | null;
    /** `states.mute` */
    muted: boolean | null;
    /** `states.currentApp` */
    currentApp: string | null;
    /** Key that was pressed last, used for the short press highlight. */
    pressed: string | null;
}

export class RemoteControlComponent extends WidgetGeneric<RemoteControlState, RemoteControlSettings> {
    private subscribedIds: Array<{
        id: string;
        handler: (id: string, state: ioBroker.State | null | undefined) => void;
    }> = [];

    private pressTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: WidgetGenericProps<RemoteControlSettings>) {
        super(props);
        this.state = {
            ...this.state,
            on: null,
            volume: null,
            muted: null,
            currentApp: null,
            pressed: null,
        };
    }

    static override getConfigSchema(): { name: string; schema: ConfigItemPanel | ConfigItemTabs } {
        const schema: JsonConfigItemPanel = {
            type: 'panel',
            items: {
                instance: {
                    type: 'instance',
                    adapter: 'lgtv',
                    label: 'lgtvremote_instance',
                    default: 'lgtv.0',
                    sm: 12,
                },
                showStatus: {
                    type: 'checkbox',
                    label: 'lgtvremote_showStatus',
                    default: true,
                    sm: 6,
                },
                showChannel: {
                    type: 'checkbox',
                    label: 'lgtvremote_showChannel',
                    default: true,
                    sm: 6,
                },
                showMedia: {
                    type: 'checkbox',
                    label: 'lgtvremote_showMedia',
                    default: true,
                    sm: 6,
                },
                showColorKeys: {
                    type: 'checkbox',
                    label: 'lgtvremote_showColorKeys',
                    default: true,
                    sm: 6,
                },
                showNumpad: {
                    type: 'checkbox',
                    label: 'lgtvremote_showNumpad',
                    default: false,
                    sm: 6,
                },
                icon: {
                    type: 'component',
                    subType: 'iconSelect',
                    label: 'lgtvremote_icon',
                    sm: 6,
                },
                name: {
                    type: 'text',
                    label: 'lgtvremote_name',
                    sm: 12,
                },
            },
        };

        return { name: 'LgTvRemote', schema: schema as unknown as ConfigItemPanel };
    }

    private get instance(): string {
        return this.props.settings.instance || 'lgtv.0';
    }

    componentDidMount(): void {
        super.componentDidMount?.();
        this.subscribeStates();
    }

    componentDidUpdate(prevProps: Readonly<WidgetGenericProps<RemoteControlSettings>>): void {
        super.componentDidUpdate?.(prevProps, this.state);
        if (prevProps.settings.instance !== this.props.settings.instance) {
            this.unsubscribeStates();
            this.setState({ on: null, volume: null, muted: null, currentApp: null });
            this.subscribeStates();
        }
    }

    componentWillUnmount(): void {
        super.componentWillUnmount?.();
        this.unsubscribeStates();
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
    }

    private subscribeStates(): void {
        const ctx = this.props.stateContext;
        const sub = (
            id: string,
            apply: (state: ioBroker.State) => void,
        ): void => {
            const handler = (_id: string, state: ioBroker.State | null | undefined): void => {
                if (state) {
                    apply(state);
                }
            };
            ctx.getState(id, handler);
            this.subscribedIds.push({ id, handler });
        };

        sub(`${this.instance}.states.on`, s => this.setState({ on: !!s.val }));
        sub(`${this.instance}.states.volume`, s => this.setState({ volume: s.val == null ? null : Number(s.val) }));
        sub(`${this.instance}.states.mute`, s => this.setState({ muted: !!s.val }));
        sub(`${this.instance}.states.currentApp`, s => this.setState({ currentApp: s.val ? String(s.val) : '' }));
    }

    private unsubscribeStates(): void {
        const ctx = this.props.stateContext;
        for (const { id, handler } of this.subscribedIds) {
            ctx.removeState(id, handler);
        }
        this.subscribedIds = [];
    }

    /** Write `true` to a `remote.<key>` button state. */
    private press(key: string): void {
        const id = `${this.instance}.remote.${key}`;
        void this.props.stateContext.getSocket().setState(id, true, false);
        // Brief visual feedback — the button states are write-only, so nothing comes back.
        this.setState({ pressed: key });
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
        }
        this.pressTimer = setTimeout(() => {
            this.pressTimer = null;
            this.setState({ pressed: null });
        }, 180);
    }

    /** Active = the TV is currently on (drives the host's "active" tile styling). */
    protected isTileActive(): boolean {
        return this.state.on === true;
    }

    /** One remote key. Rendered as a styled Box so no MUI icon needs to be bridged. */
    private renderKey(
        key: string,
        label: React.ReactNode,
        opts?: { color?: string; wide?: boolean; fontSize?: string; title?: string },
    ): React.JSX.Element {
        const isPressed = this.state.pressed === key;
        return (
            <Box
                key={key}
                component="button"
                title={opts?.title || key}
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    this.press(key);
                }}
                sx={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    width: opts?.wide ? undefined : '100%',
                    aspectRatio: opts?.wide ? undefined : '1',
                    height: opts?.wide ? '100%' : undefined,
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.16)',
                    bgcolor: opts?.color || (isPressed ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.08)'),
                    color: opts?.color ? '#fff' : 'inherit',
                    fontSize: opts?.fontSize || '0.95rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    userSelect: 'none',
                    transform: isPressed ? 'scale(0.92)' : 'none',
                    transition: 'transform 0.08s ease, background-color 0.15s ease',
                    '&:hover': { bgcolor: opts?.color || 'rgba(255,255,255,0.20)' },
                }}
            >
                {label}
            </Box>
        );
    }

    /** Power key — coloured, because it is the one key that also works while the TV is off. */
    private renderPowerKey(): React.JSX.Element {
        return this.renderKey('power', '⏻', {
            color: this.state.on ? '#b3382f' : '#3f7d46',
            fontSize: '1.2rem',
            title: I18n.t('lgtvremote_power'),
        });
    }

    /** Directional pad with OK in the middle. */
    private renderDPad(): React.JSX.Element {
        return (
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 0.5,
                    width: '100%',
                    maxWidth: 190,
                    mx: 'auto',
                }}
            >
                <Box />
                {this.renderKey('up', '▲', { title: I18n.t('lgtvremote_up') })}
                <Box />
                {this.renderKey('left', '◀', { title: I18n.t('lgtvremote_left') })}
                {this.renderKey('enter', 'OK', { fontSize: '0.8rem', title: I18n.t('lgtvremote_ok') })}
                {this.renderKey('right', '▶', { title: I18n.t('lgtvremote_right') })}
                <Box />
                {this.renderKey('down', '▼', { title: I18n.t('lgtvremote_down') })}
                <Box />
            </Box>
        );
    }

    /** back / home / menu / exit */
    private renderNavRow(): React.JSX.Element {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.5, width: '100%' }}>
                {this.renderKey('back', '↩', { title: I18n.t('lgtvremote_back') })}
                {this.renderKey('home', '⌂', { title: I18n.t('lgtvremote_home') })}
                {this.renderKey('menu', '☰', { title: I18n.t('lgtvremote_menu') })}
                {this.renderKey('exit', '✕', { title: I18n.t('lgtvremote_exit') })}
            </Box>
        );
    }

    /** Volume column and, optionally, the channel column next to it. */
    private renderVolumeChannelRow(): React.JSX.Element {
        const showChannel = this.props.settings.showChannel !== false;
        return (
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: showChannel ? 'repeat(6, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                    gap: 0.5,
                    width: '100%',
                }}
            >
                {this.renderKey('volumeUp', '+', { fontSize: '1.1rem', title: I18n.t('lgtvremote_volumeUp') })}
                {this.renderKey('mute', 'Ø', { title: I18n.t('lgtvremote_mute') })}
                {this.renderKey('volumeDown', '−', { fontSize: '1.1rem', title: I18n.t('lgtvremote_volumeDown') })}
                {showChannel
                    ? [
                          this.renderKey('channelUp', 'CH+', {
                              fontSize: '0.72rem',
                              title: I18n.t('lgtvremote_channelUp'),
                          }),
                          this.renderKey('info', 'ℹ', { title: I18n.t('lgtvremote_info') }),
                          this.renderKey('channelDown', 'CH−', {
                              fontSize: '0.72rem',
                              title: I18n.t('lgtvremote_channelDown'),
                          }),
                      ]
                    : null}
            </Box>
        );
    }

    private renderMediaRow(): React.JSX.Element {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 0.5, width: '100%' }}>
                {this.renderKey('rewind', '«', { fontSize: '1.15rem', title: I18n.t('lgtvremote_rewind') })}
                {this.renderKey('play', '▶', { title: I18n.t('lgtvremote_play') })}
                {this.renderKey('pause', '⏸', { title: I18n.t('lgtvremote_pause') })}
                {this.renderKey('stop', '■', { title: I18n.t('lgtvremote_stop') })}
                {this.renderKey('fastForward', '»', {
                    fontSize: '1.15rem',
                    title: I18n.t('lgtvremote_fastForward'),
                })}
            </Box>
        );
    }

    private renderColorRow(): React.JSX.Element {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.5, width: '100%' }}>
                {COLOR_KEYS.map(c => this.renderKey(c.key, '', { color: c.color, title: c.key }))}
            </Box>
        );
    }

    private renderNumpad(): React.JSX.Element {
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'dash', '0', 'flashback'];
        const labels: Record<string, string> = { dash: '–', flashback: '↺' };
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.5, width: '100%' }}>
                {keys.map(k => this.renderKey(k, labels[k] ?? k, { title: k }))}
            </Box>
        );
    }

    /** Header line: icon, name, and the current volume / mute / app status. */
    private renderHeader(compact: boolean): React.JSX.Element {
        const { on, volume, muted, currentApp } = this.state;
        const name = this.props.settings.name || I18n.t('lgtvremote_title');
        const showStatus = this.props.settings.showStatus !== false;
        // "com.webos.app.livetv" -> "livetv" — the full reverse-domain id is noise on a tile.
        const app = currentApp ? currentApp.split('.').pop() : null;
        const statusParts: string[] = [];
        if (volume != null && isFinite(volume)) {
            statusParts.push(muted ? `${volume} (${I18n.t('lgtvremote_muted')})` : String(volume));
        } else if (muted) {
            statusParts.push(I18n.t('lgtvremote_muted'));
        }
        if (app) {
            statusParts.push(app);
        }

        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    width: '100%',
                    minWidth: 0,
                    mb: compact ? 0.25 : 0.5,
                }}
            >
                {this.renderTileIcon()}
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <Typography
                        variant={compact ? 'caption' : 'body2'}
                        sx={{
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.25,
                        }}
                    >
                        {name}
                    </Typography>
                    {showStatus && statusParts.length ? (
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.75,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {statusParts.join(' · ')}
                        </Typography>
                    ) : null}
                </Box>
                <Box
                    component="span"
                    sx={{
                        flex: '0 0 auto',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: on === null ? '#7a828a' : on ? '#3fbf5f' : '#8a3b34',
                    }}
                    title={
                        on === null
                            ? I18n.t('lgtvremote_unknown')
                            : on
                              ? I18n.t('lgtvremote_online')
                              : I18n.t('lgtvremote_offline')
                    }
                />
            </Box>
        );
    }

    protected renderTileIcon(): React.JSX.Element | null {
        const customIcon = this.state.on
            ? this.props.settings?.iconActive || this.props.settings?.icon
            : this.props.settings?.icon;
        if (!customIcon) {
            return null;
        }
        return (
            <Icon
                src={customIcon}
                style={{ width: 22, height: 22, flex: '0 0 auto' }}
            />
        );
    }

    /** Full remote — used by the tall layouts where there is room for the whole key set. */
    private renderRemote(): React.JSX.Element {
        const s = this.props.settings;
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    px: 0.5,
                    maxWidth: 300,
                    mx: 'auto',
                }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {this.renderHeader(false)}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.5, width: '100%' }}>
                    {this.renderPowerKey()}
                    {this.renderKey('list', '≡', { title: I18n.t('lgtvremote_list') })}
                    {this.renderKey('qmenu', 'Q', { title: I18n.t('lgtvremote_qmenu') })}
                    {this.renderKey('myApps', '⊞', { title: I18n.t('lgtvremote_myApps') })}
                </Box>
                {this.renderDPad()}
                {this.renderNavRow()}
                {this.renderVolumeChannelRow()}
                {s.showMedia !== false ? this.renderMediaRow() : null}
                {s.showColorKeys !== false ? this.renderColorRow() : null}
                {s.showNumpad === true ? this.renderNumpad() : null}
            </Box>
        );
    }

    /** 1x1 — only the essentials fit: power plus volume and mute. */
    renderCompact(): React.JSX.Element {
        const isActive = this.isTileActive();
        const accent = this.getAccentColor();
        const indicators = this.renderIndicators(this.renderSettingsButton());
        return (
            <Box
                id={String(this.props.widget.id)}
                className={this.getWidgetClass()}
                sx={theme => WidgetGeneric.getStyleCompact(theme)}
            >
                <Box
                    sx={theme => ({
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 0,
                        width: '100%',
                        aspectRatio: '1',
                        overflow: 'hidden',
                        ...(getTileStyles(theme, isActive, accent) as any),
                        padding: isNeumorphicTheme(theme) ? '4px' : '6px',
                    })}
                >
                    <div
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        style={{ display: 'contents' }}
                    >
                        {indicators}
                    </div>
                    <Box
                        sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', flex: 1, minHeight: 0 }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        {this.renderHeader(true)}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: 0.5,
                                width: '100%',
                                flex: 1,
                                alignContent: 'center',
                            }}
                        >
                            {this.renderPowerKey()}
                            {this.renderKey('volumeUp', '+', { fontSize: '1.1rem' })}
                            {this.renderKey('volumeDown', '−', { fontSize: '1.1rem' })}
                            {this.renderKey('home', '⌂')}
                            {this.renderKey('enter', 'OK', { fontSize: '0.75rem' })}
                            {this.renderKey('mute', 'Ø')}
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    /** 2x0.5 — a single control strip. */
    renderWide(): React.JSX.Element {
        const isActive = this.isTileActive();
        const accent = this.getAccentColor();
        const indicators = this.renderIndicators(this.renderSettingsButton());
        return (
            <Box
                id={String(this.props.widget.id)}
                className={this.getWidgetClass()}
                sx={theme => WidgetGeneric.getStyleWide(theme)}
            >
                <Box
                    sx={theme => ({
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        overflow: 'hidden',
                        ...(getTileStyles(theme, isActive, accent) as any),
                        padding: isNeumorphicTheme(theme) ? '6px' : '8px',
                    })}
                >
                    <div
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        style={{ display: 'contents' }}
                    >
                        {indicators}
                    </div>
                    <Box sx={{ flex: 1, minWidth: 0 }}>{this.renderHeader(true)}</Box>
                    <Box
                        sx={{ display: 'flex', gap: 0.5, height: 34, flex: '0 0 auto' }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        {this.renderPowerKey()}
                        {this.renderKey('volumeDown', '−', { fontSize: '1.1rem' })}
                        {this.renderKey('mute', 'Ø')}
                        {this.renderKey('volumeUp', '+', { fontSize: '1.1rem' })}
                        {this.renderKey('home', '⌂')}
                    </Box>
                </Box>
            </Box>
        );
    }

    /** 2x1 / 2x2 — the full remote. */
    renderWideTall(): React.JSX.Element {
        const isActive = this.isTileActive();
        const accent = this.getAccentColor();
        const indicators = this.renderIndicators(this.renderSettingsButton());
        return (
            <Box
                id={String(this.props.widget.id)}
                className={this.getWidgetClass()}
                sx={theme => WidgetGeneric.getStyleWideTall(theme)}
            >
                <Box
                    sx={theme => ({
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        ...(getTileStyles(theme, isActive, accent) as any),
                        padding: isNeumorphicTheme(theme) ? '8px' : '10px',
                    })}
                >
                    <div
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        style={{ display: 'contents' }}
                    >
                        {indicators}
                    </div>
                    {this.renderRemote()}
                </Box>
            </Box>
        );
    }
}

export default RemoteControlComponent;
