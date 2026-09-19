import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

/**
 * Compiled to `build/prebuilds/`, so the checkout is three levels up. Deliberately not
 * `EXPO_ROOT_DIR`: the gate regenerates every manifest of the working tree it ships in, and
 * pointing it at another checkout would have it pass having compared nothing of this one.
 */
const toolsDir = path.resolve(__dirname, '../..');
const repo = path.resolve(toolsDir, '..');
const gate = path.join(toolsDir, 'scripts', 'check-spm-manifest-collateral.cjs');

type GateMode = 'production-depth' | 'marker-collision' | 'collateral-drift';

/**
 * Instruments the generator from inside the gate's worker process: every mode reads or rewrites
 * the manifests as they are generated, which is the only way to perturb an input the gate derives
 * for itself.
 */
const INSTRUMENT_WRITES = String.raw`
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const writeFileSync = fs.writeFileSync;
const readFileSync = fs.readFileSync;

function inspect(file, content) {
  if (path.basename(String(file)) !== 'Package.swift' || !String(file).includes('/after/')) {
    return content;
  }
  const normalized = String(file).split(path.sep).join('/');
  const match = normalized.match(/^(.*\/after\/repo)\/packages\//);
  if (!match) return content;
  const fixtureRoot = match[1].split('/').join(path.sep);
  if (process.env.SPM_COLLATERAL_TEST_MODE === 'production-depth') {
    assert.match(
      normalized,
      /\/generated\/[^/]+\/Package\.swift$/,
      'generated manifest must use the production generated/<product>/Package.swift path'
    );
  }
  if (process.env.SPM_COLLATERAL_TEST_MODE === 'marker-collision') {
    const text = Buffer.isBuffer(content) ? content.toString() : String(content);
    const mutated = text.split(fixtureRoot).join('<EXPO_ROOT_DIR>');
    writeFileSync(file, mutated);
    return mutated;
  }
  if (process.env.SPM_COLLATERAL_TEST_MODE === 'collateral-drift') {
    const text = Buffer.isBuffer(content) ? content.toString() : String(content);
    return text + '\n// drifted\n';
  }
  return content;
}

fs.readFileSync = function (file, ...args) {
  const content = readFileSync.call(this, file, ...args);
  return inspect(file, content);
};
`;

function runGate(mode: GateMode): SpawnSyncReturns<string> {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-manifest-collateral-test-'));
  const preload = path.join(scratch, 'instrument-writes.cjs');
  fs.writeFileSync(preload, INSTRUMENT_WRITES);
  try {
    return spawnSync(process.execPath, [gate], {
      cwd: repo,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: [process.env.NODE_OPTIONS, `--require=${preload}`].filter(Boolean).join(' '),
        SPM_COLLATERAL_TEST_MODE: mode,
      },
      maxBuffer: 32 * 1024 * 1024,
    });
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

/**
 * Runs the collateral gate, which regenerates every product's `Package.swift` at the baseline
 * commit and on the working tree and requires the two to be byte-identical. It is half the
 * acceptance criterion of every SwiftPM migration step: the packages *not* being migrated must
 * emit exactly what they emitted before.
 */
describe('check-spm-manifest-collateral', () => {
  it('passes at the production generated/<product>/Package.swift depth', () => {
    const result = runGate('production-depth');

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /PASS: 154 byte-identical manifests/);
  });

  it('fails when a generated manifest drifts from the baseline', () => {
    const result = runGate('collateral-drift');

    assert.notEqual(result.status, 0, 'a manifest that no longer matches the baseline must fail');
    assert.match(`${result.stdout}\n${result.stderr}`, /DIFF: /);
    assert.match(`${result.stdout}\n${result.stderr}`, /Collateral manifest changes/);
  });

  it('fails when a generated manifest contains the reserved normalization marker', () => {
    const result = runGate('marker-collision');

    assert.notEqual(result.status, 0, 'a literal normalization marker must fail the gate');
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /reserved normalization marker.*<EXPO_ROOT_DIR>/i
    );
  });
});
