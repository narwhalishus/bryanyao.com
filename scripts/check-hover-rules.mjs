#!/usr/bin/env node
// Guard against the flicker regression from PR #14.
//
// In physics-active mode, `.obj` wrappers carry a physics-written inline
// `transform: translate(...)`. A CSS hover rule that targets `.obj` itself
// (not its descendants) with `transform: none !important` wipes that
// transform whenever any descendant is hovered, because `:hover` matches
// up the ancestor chain. The visible symptom is every object snapping to
// the desk's 0,0 corner on hover.
//
// Correct form: `body.physics-active [data-desk] .obj *:hover` (descendant).
// Buggy form:   `body.physics-active [data-desk] .obj:hover`   (wrapper).
//
// History: PR #6 (April) fixed this; PR #14 reintroduced it.
//
// This script does a syntactic check on src/styles/global.css. It does not
// replace a full browser-level test, but it catches the specific regression
// this project has already hit twice.

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, '..', 'src', 'styles', 'global.css');
const css = readFileSync(cssPath, 'utf8');

// The buggy pattern: `.obj:hover` (no whitespace or `*` before `:hover`)
// inside a physics-active scope, paired with `transform: none`.
// We look for a line containing the wrapper-form selector, then verify
// the next declaration block sets transform: none.
const lines = css.split('\n');
const errors = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.includes('physics-active')) continue;
  // Match `.obj:hover` (not `.obj *:hover`, not `.obj > *:hover`).
  if (/\.obj:hover/.test(line) && !/\.obj\s+\*:hover|\.obj\s+>\s*\*:hover/.test(line)) {
    // Look ahead a few lines for `transform: none`.
    for (let j = i; j < Math.min(i + 5, lines.length); j++) {
      if (/transform:\s*none/.test(lines[j])) {
        errors.push({
          line: i + 1,
          selector: line.trim(),
          declaration: lines[j].trim(),
        });
        break;
      }
    }
  }
}

if (errors.length > 0) {
  console.error('ERROR: flicker-regression guard in scripts/check-hover-rules.mjs');
  console.error('src/styles/global.css contains a `.obj:hover` rule that wipes transform.');
  console.error('This reintroduces the bug PR #6 and #14-revert fixed.');
  console.error('');
  for (const e of errors) {
    console.error(`  line ${e.line}: ${e.selector}`);
    console.error(`            ${e.declaration}`);
  }
  console.error('');
  console.error('Fix: use the descendant form `.obj *:hover` — see script header for why.');
  process.exit(1);
}

console.log('ok: no `.obj:hover { transform: none }` regression in global.css');
