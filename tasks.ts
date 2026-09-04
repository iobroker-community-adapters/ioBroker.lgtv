// Build steps that go beyond `tsc`. The backend build is plain TypeScript (`npm run build`);
// this file builds the ioBroker.devices widget in `src-devices/` and copies the federation
// bundle into `admin/dm-widgets/`, from where the devices adapter loads it at runtime.
//
// The result is committed, so neither CI nor `npm pack` has to run a Vite build — run
// `npm run build-devices` yourself whenever something under `src-devices/` changed.
import { deleteFoldersRecursive, copyFiles, npmInstall, buildReact } from '@iobroker/build-tools';

// tsx appends its loader bootstrap to process.execArgv; child_process.fork() inherits it, and the
// forked vite then loads vite.config.ts through that hook as CommonJS - where the federation
// plugin's `import.meta.resolve` is undefined and the build dies with
// "define_import_meta_default.resolve is not a function". Clear it before forking.
process.execArgv = [];

function clean(): void {
    deleteFoldersRecursive(`${__dirname}/admin/dm-widgets`);
    deleteFoldersRecursive(`${__dirname}/src-devices/build`);
}

function build(): Promise<void> {
    return buildReact(`${__dirname}/src-devices/`, { rootDir: `${__dirname}/src-devices/`, vite: true });
}

// `mf-manifest.json` is copied on purpose: admin fetches it next to the remote entry to decide
// from the shared modules which GUI API generation this component was built against.
function copyAllFiles(): void {
    copyFiles(['src-devices/build/**/*', '!src-devices/build/index.html'], 'admin/dm-widgets/');
    copyFiles(['src-devices/img/**/*'], 'admin/dm-widgets');
    copyFiles(['src-devices/src/i18n/*.json'], 'admin/dm-widgets/i18n');
}

if (process.argv.includes('--0-clean')) {
    clean();
} else if (process.argv.includes('--1-npm')) {
    npmInstall(`${__dirname}/src-devices/`).catch((e: unknown) => {
        console.error(`Cannot install npm: ${e as string}`);
        process.exit(1);
    });
} else if (process.argv.includes('--2-build')) {
    build().catch((e: unknown) => {
        console.error(`Cannot build the widget: ${e as string}`);
        process.exit(1);
    });
} else if (process.argv.includes('--3-copy')) {
    copyAllFiles();
} else {
    clean();
    npmInstall(`${__dirname}/src-devices/`)
        .then(() => build())
        .then(() => copyAllFiles())
        .catch((e: unknown) => {
            console.error(`Cannot build: ${e as string}`);
            process.exit(1);
        });
}
