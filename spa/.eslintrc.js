module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  globals: {
    Promise: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'prettier',
    'react-app',
    'react-app/jest',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        printWidth: 80,
      },
    ],
    'require-await': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-unused-vars': 'off',
    'no-constant-condition': 'off',
    'no-case-declarations': 'off',
    'no-dupe-class-members': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
