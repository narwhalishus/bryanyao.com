import {defineConfig} from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig(
  {ignores: ['dist/', '.astro/', 'node_modules/', 'public/']},
  {files: ['src/**/*.{js,ts,astro}']},
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
  eslintConfigPrettier,
  {
    // Astro generates src/env.d.ts with a `/// <reference …>` directive as
    // part of the content-collections workflow; we can't rewrite it.
    files: ['src/env.d.ts'],
    rules: {'@typescript-eslint/triple-slash-reference': 'off'},
  },
);
