import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageDirectory = fileURLToPath(new URL('.', import.meta.url));
const oxlint = fileURLToPath(new URL('../../../node_modules/.bin/oxlint', import.meta.url));
const config = join(packageDirectory, 'oxlint.config.base.js');

function lint(code, configPath = config) {
  const directory = mkdtempSync(join(tmpdir(), 'expo-oxlint-'));
  const filename = join(directory, 'example.ts');
  try {
    writeFileSync(filename, code);
    const result = spawnSync(oxlint, ['--config', configPath, '--format', 'json', filename], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout).diagnostics;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function warningsFor(code, ruleId) {
  const [plugin, rule] = ruleId.includes('/') ? ruleId.split('/') : ['eslint', ruleId];
  return lint(code).filter((diagnostic) => diagnostic.code === `${plugin}(${rule})`);
}

test('prefers a ternary for a single-line if/else assignment', () => {
  assert.equal(
    warningsFor(
      'let value; if (ready) value = first; else value = second;',
      'unicorn/prefer-ternary'
    ).length,
    1
  );
});

test('allows an if/else assignment with a multi-line condition', () => {
  assert.equal(
    warningsFor(
      'let value;\nif (ready &&\n    enabled) {\n  value = first;\n} else {\n  value = second;\n}',
      'unicorn/prefer-ternary'
    ).length,
    0
  );
});

test('warns about nested ternaries', () => {
  assert.equal(warningsFor('const value = a ? b ? c : d : e;', 'no-nested-ternary').length, 1);
});

test('warns when a ternary spans more than three source lines', () => {
  assert.equal(
    warningsFor('const value = ready\n  ? first\n  : second +\n    third;', 'expo/ternary-limits')
      .length,
    1
  );
});

test('allows a ternary that spans exactly three source lines', () => {
  assert.equal(
    warningsFor('const value = ready\n  ? first\n  : second;', 'expo/ternary-limits').length,
    0
  );
});

test('warns when a ternary test has four boolean clauses', () => {
  assert.equal(
    warningsFor('const value = a && (b || c) && d ? first : second;', 'expo/ternary-limits').length,
    1
  );
});

test('counts boolean clauses inside a negated group', () => {
  assert.equal(
    warningsFor('const value = !(a && b && c && d) ? first : second;', 'expo/ternary-limits')
      .length,
    1
  );
});

test('counts boolean clauses through a TypeScript as expression', () => {
  assert.equal(
    warningsFor(
      'const value = ((a && b && c && d) as boolean) ? first : second;',
      'expo/ternary-limits'
    ).length,
    1
  );
});

test('counts boolean clauses through a TypeScript satisfies expression', () => {
  assert.equal(
    warningsFor(
      'const value = ((a && b && c && d) satisfies boolean) ? first : second;',
      'expo/ternary-limits'
    ).length,
    1
  );
});

test('counts boolean clauses through a TypeScript non-null expression', () => {
  assert.equal(
    warningsFor('const value = (a && b && c && d)! ? first : second;', 'expo/ternary-limits')
      .length,
    1
  );
});

test('counts boolean clauses inside a nullish coalescing expression', () => {
  assert.equal(
    warningsFor(
      'const value = (fallback ?? (a && b && c && d)) ? first : second;',
      'expo/ternary-limits'
    ).length,
    1
  );
});

test('allows a ternary test with three boolean clauses', () => {
  assert.equal(
    warningsFor('const value = a && (b || c) ? first : second;', 'expo/ternary-limits').length,
    0
  );
});

test('reports style violations as warnings', () => {
  for (const [code, ruleId] of [
    ['let value; if (ready) value = first; else value = second;', 'unicorn/prefer-ternary'],
    ['const value = a ? b ? c : d : e;', 'no-nested-ternary'],
    ['const value = a && b && c && d ? first : second;', 'expo/ternary-limits'],
  ]) {
    assert.equal(warningsFor(code, ruleId)[0]?.severity, 'warning', ruleId);
  }
});

test('makes the custom rule available through a consuming package config', () => {
  const consumerConfig = join(packageDirectory, '../../expo-crypto/oxlint.config.mjs');
  const diagnostics = lint('const value = a && b && c && d ? first : second;', consumerConfig);
  assert.equal(diagnostics.filter(({ code }) => code === 'expo(ternary-limits)').length, 1);
});
