// Build steps that go beyond `tsc`. The backend build is plain TypeScript (`npm run build`);
// this file builds the two React bundles and copies them into `admin/`:
//
//   src-devices/ -> admin/dm-widgets/  the ioBroker.devices widget (Control TV remote)
//   src-admin/   -> admin/custom/      the jsonConfig custom component (Remote control tab)
//
// Both results are committed, so neither CI nor `npm pack` has to run a Vite build — run
// `npm run build-devices` / `npm run build-admin` yourself whenever the sources changed.
import { deleteFoldersRecursive, copyFiles, npmInstall, buildReact } from '@iobroker/build-tools';

// tsx appends its loader bootstrap to process.execArgv; child_process.fork() inherits it, and the
// forked vite then loads vite.config.ts through that hook as CommonJS - where the federation
// plugin's `import.meta.resolve` is undefined and the build dies with
// "define_import_meta_default.resolve is not a function". Clear it before forking.
process.execArgv = [];

interface Target {
    /** source directory, e.g. `<root>/src-admin/` */
    src: string;
    clean: () => void;
    copy: () => void;
}

const TARGETS: Record<'devices' | 'admin', Target> = {
    devices: {
        src: `${__dirname}/src-devices/`,
        clean: (): void => {
            deleteFoldersRecursive(`${__dirname}/admin/dm-widgets`);
            deleteFoldersRecursive(`${__dirname}/src-devices/build`);
        },
        // `mf-manifest.json` is copied on purpose: admin fetches it next to the remote entry to
        // decide from the shared modules which GUI API generation this component was built against.
        copy: (): void => {
            copyFiles(['src-devices/build/**/*', '!src-devices/build/index.html'], 'admin/dm-widgets/');
            copyFiles(['src-devices/img/**/*'], 'admin/dm-widgets');
            copyFiles(['src-devices/src/i18n/*.json'], 'admin/dm-widgets/i18n');
        },
    },
    admin: {
        src: `${__dirname}/src-admin/`,
        clean: (): void => {
            deleteFoldersRecursive(`${__dirname}/admin/custom`);
            deleteFoldersRecursive(`${__dirname}/src-admin/build`);
        },
        // The i18n files land next to the remote entry because the jsonConfig item sets
        // `"i18n": true`, which makes admin load `<url>/../i18n/<lang>.json` for the component.
        copy: (): void => {
            copyFiles(['src-admin/build/**/*', '!src-admin/build/index.html'], 'admin/custom/');
            copyFiles(['src-admin/src/i18n/*.json'], 'admin/custom/i18n');
        },
    },
};

const target: Target = process.argv.includes('--admin') ? TARGETS.admin : TARGETS.devices;

function build(): Promise<void> {
    return buildReact(target.src, { rootDir: target.src, vite: true });
}

function fail(what: string): (e: unknown) => never {
    return (e: unknown): never => {
        console.error(`Cannot ${what}: ${e as string}`);
        process.exit(1);
    };
}

if (process.argv.includes('--0-clean')) {
    target.clean();
} else if (process.argv.includes('--1-npm')) {
    npmInstall(target.src).catch(fail('install npm'));
} else if (process.argv.includes('--2-build')) {
    build().catch(fail('build'));
} else if (process.argv.includes('--3-copy')) {
    target.copy();
} else {
    target.clean();
    npmInstall(target.src)
        .then(() => build())
        .then(() => target.copy())
        .catch(fail('build'));
}
