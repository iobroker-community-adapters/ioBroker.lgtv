// Standalone dev harness - `cd src-admin && npm start`. It is NOT part of the federation build;
// the admin host renders `RemoteControl` directly. Point it at a js-controller on :8081 and it
// talks to a real lgtv.0 instance.
import React from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { Box } from '@mui/material';

import {
    GenericApp,
    I18n,
    type IobTheme,
    Loader,
    type GenericAppProps,
    type GenericAppState,
} from '@iobroker/gui-components';

import RemoteControl from './RemoteControl';

import enLocal from './i18n/en.json';
import deLocal from './i18n/de.json';
import ruLocal from './i18n/ru.json';
import ptLocal from './i18n/pt.json';
import nlLocal from './i18n/nl.json';
import frLocal from './i18n/fr.json';
import itLocal from './i18n/it.json';
import esLocal from './i18n/es.json';
import plLocal from './i18n/pl.json';
import ukLocal from './i18n/uk.json';
import zhCNLocal from './i18n/zh-cn.json';

const styles: Record<string, any> = {
    app: (theme: IobTheme): React.CSSProperties => ({
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        height: '100%',
    }),
    item: {
        padding: 24,
    },
};

interface AppState extends GenericAppState {
    data: Record<string, any>;
    originalData: Record<string, any>;
}

export default class App extends GenericApp<GenericAppProps, AppState> {
    constructor(props: GenericAppProps) {
        const extendedProps = { ...props };
        super(props, extendedProps);

        this.state = {
            ...this.state,
            data: {},
            originalData: {},
            theme: this.createTheme(),
        };

        I18n.setTranslations({
            en: enLocal,
            de: deLocal,
            ru: ruLocal,
            pt: ptLocal,
            nl: nlLocal,
            fr: frLocal,
            it: itLocal,
            es: esLocal,
            pl: plLocal,
            uk: ukLocal,
            'zh-cn': zhCNLocal,
        });
        // @ts-expect-error userLanguage could exist
        I18n.setLanguage((navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase());
    }

    render(): React.JSX.Element {
        if (!this.state.loaded) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeType={this.state.themeType} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Box sx={styles.app}>
                        <div style={styles.item}>
                            <RemoteControl
                                oContext={{
                                    adapterName: 'lgtv',
                                    socket: this.socket,
                                    instance: 0,
                                    themeType: this.state.theme.palette.mode,
                                    isFloatComma: true,
                                    dateFormat: '',
                                    forceUpdate: () => {},
                                    systemConfig: {} as ioBroker.SystemConfigCommon,
                                    theme: this.state.theme,
                                    _themeName: this.state.themeName,
                                    onCommandRunning: (_commandRunning: boolean): void => {},
                                }}
                                alive
                                changed={false}
                                themeName={this.state.theme.palette.mode}
                                common={{} as ioBroker.InstanceCommon}
                                attr="_remote"
                                data={this.state.data}
                                originalData={this.state.originalData}
                                onError={() => {}}
                                schema={{
                                    url: '',
                                    i18n: true,
                                    name: 'ConfigCustomLgTvSet/Components/RemoteControl',
                                    type: 'custom',
                                }}
                                onChange={data => this.setState({ data: data as Record<string, any> })}
                            />
                        </div>
                    </Box>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}
