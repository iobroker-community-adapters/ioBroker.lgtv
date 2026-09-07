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
            // own tsconfig, not part of the adapter's type-aware project. src-admin brings its
            // own eslint config and is linted by `npm run lint-admin`; src-devices has none and
            // is not linted at all.
            'src-devices/**/*',
            'src-admin/**/*',
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
