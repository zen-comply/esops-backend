import globals from 'globals';
import pluginJs from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.mocha,
                ...globals.es2021,
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
    pluginJs.configs.recommended,
    {
        rules: {
            'no-console': 'error',
            'no-unused-vars': [
                'error',
                {
                    vars: 'all', // Check all variables
                    args: 'after-used', // Allow unused function arguments only if they come before used ones
                    ignoreRestSiblings: true, // Ignore unused siblings in object destructuring
                },
            ],
            quotes: 'off',
        },
    },
    prettierConfig,
    {
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
        },
    },
];
