import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: { react, reactHooks },
    rules: {
      'react/react-in-jsx-scope': 'off', // not needed with React 17+
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    ignores: [
      'node_modules',
      'dist/',
      'build/',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      'coverage/',
      '.nyc_output/',
    ],
  }
)
