import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import { federation } from '@module-federation/vite';
import { moduleFederationShared } from '@iobroker/gui-components/modulefederation.admin.config';

// An explicit list, NOT package.json: moduleFederationShared() would otherwise share everything
// the harness needs too, and every shared module gets a full fallback bundle emitted next to the
// remote entry - `@iobroker/gui-components` alone is 7.3 MB that the admin host never loads,
// because it supplies the module itself. Only what RemoteControl.tsx actually imports belongs
// here; `@iobroker/gui-components` stays a devDependency for the standalone dev harness.
const SHARED = ['@emotion/react', '@emotion/styled', '@iobroker/json-config', '@mui/material', 'react', 'react-dom'];

const config = {
    plugins: [
        federation({
            manifest: true,
            // Must be unique across all admin components and match the first segment of `name`
            // in admin/jsonConfig.json ("ConfigCustomLgTvSet/Components/RemoteControl").
            name: 'ConfigCustomLgTvSet',
            filename: 'customComponents.js',
            exposes: {
                './Components': './src/Components.tsx',
            },
            remotes: {},
            shared: moduleFederationShared(SHARED),
            dts: false,
        }),
        react(),
        commonjs(),
    ],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        port: 4173,
        proxy: {
            '/files': 'http://localhost:8081',
            '/adapter': 'http://localhost:8081',
            '/session': 'http://localhost:8081',
            '/log': 'http://localhost:8081',
            '/lib': 'http://localhost:8081',
        },
    },
    base: './',
    build: {
        target: 'chrome89',
        outDir: './build',
        rollupOptions: {
            onwarn(warning: { code: string }, warn: (warning: { code: string }) => void): void {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return;
                }
                warn(warning);
            },
        },
    },
};

export default config;
