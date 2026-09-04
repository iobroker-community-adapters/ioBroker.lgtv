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
            // own tsconfig + own eslint scope; not part of the adapter's type-aware project
            'src-devices/**/*',
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
