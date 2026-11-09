import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['*.mjs'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        ignores: [
            'admin/**/*',
            'node_modules/**/*',
            'test/**/*',
            'build/**/*',
            'tmp/**/*',
            'www/**/*',
            '.**/*',
            // own tsconfig, not part of the adapter's type-aware project. src-admin and
            // src-webcomponents bring their own eslint config and are linted by
            // `npm run lint-admin` / `npm run lint-wc`; src-devices has none and is not linted at all.
            'src-devices/**/*',
            'src-admin/**/*',
            'src-webcomponents/**/*',
            'tasks.ts',
        ],
    },
    {
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',

            '@typescript-eslint/no-require-imports': 'off',
        },
    },
];
