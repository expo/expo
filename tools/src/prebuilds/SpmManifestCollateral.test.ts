import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';

/**
 * Compiled to `build/prebuilds/`, so the checkout is three levels up. Deliberately not
 * `EXPO_ROOT_DIR`: the gate regenerates every manifest of the working tree it ships in, and
 * pointing it at another checkout would have it pass having compared nothing of this one.
 */
const toolsDir = path.resolve(__dirname, '../..');
const repo = path.resolve(toolsDir, '..');
const gate = path.join(toolsDir, 'scripts', 'check-spm-manifest-collateral.cjs');

type GateMode = 'production-depth' | 'marker-collision' | 'collateral-drift';

type InventoryComparison = {
  additions: string[];
  comparable: string[];
};

const gateModule = require(gate) as {
  ensureBaselineReachable: (base: string) => void;
  classifyInventory: (
    baseline: string[],
    current: string[],
    excluded?: ReadonlySet<string>
  ) => InventoryComparison;
  formatInventoryAdditions: (additions: string[]) => string | undefined;
};

let sharedGateResult: SpawnSyncReturns<string>;

/**
 * Instruments the generator from inside the gate's worker process: every mode reads or rewrites
 * the manifests as they are generated, which is the only way to perturb an input the gate derives
 * for itself.
 */
const INSTRUMENT_READS = String.raw`
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const writeFileSync = fs.writeFileSync;
const readFileSync = fs.readFileSync;

function inspect(file, content) {
  const normalized = String(file).split(path.sep).join('/');
  if (normalized.endsWith('/packages/expo-asset/spm.config.json')) {
    const config = JSON.parse(Buffer.isBuffer(content) ? content.toString() : String(content));
    if (process.env.SPM_COLLATERAL_INVENTORY_MODE === 'add-product') {
      config.products.push({ ...config.products[0], name: 'Round6cAddedProduct' });
      return JSON.stringify(config);
    }
    if (process.env.SPM_COLLATERAL_INVENTORY_MODE === 'remove-product') {
      config.products = config.products.filter((product) => product.name !== 'ExpoAsset');
      return JSON.stringify(config);
    }
  }
  if (path.basename(String(file)) !== 'Package.swift' || !String(file).includes('/after/')) {
    return content;
  }
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

function runGate(
  mode: GateMode,
  inventoryMode: 'add-product' | 'remove-product'
): SpawnSyncReturns<string> {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-manifest-collateral-test-'));
  const preload = path.join(scratch, 'instrument-reads.cjs');
  fs.writeFileSync(preload, INSTRUMENT_READS);
  try {
    return spawnSync(process.execPath, [gate], {
      cwd: repo,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: [process.env.NODE_OPTIONS, `--require=${preload}`].filter(Boolean).join(' '),
        SPM_COLLATERAL_INVENTORY_MODE: inventoryMode,
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
  before(() => {
    sharedGateResult = runGate('production-depth', 'add-product');
  });

  it('passes at the production generated/<product>/Package.swift depth', () => {
    assert.equal(
      sharedGateResult.status,
      0,
      `${sharedGateResult.stdout}\n${sharedGateResult.stderr}`
    );
    assert.match(sharedGateResult.stdout, /PASS: 154 byte-identical manifests/);
  });

  it('fails when a generated manifest drifts from the baseline', () => {
    const result = runGate('collateral-drift', 'add-product');
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /DIFF: /);
    assert.match(result.stderr, /Collateral manifest changes/);
  });

  it('fails when a generated manifest contains the reserved normalization marker', () => {
    const result = runGate('marker-collision', 'add-product');
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stderr, /reserved normalization marker <EXPO_ROOT_DIR>/i);
  });
});

describe('collateral product inventory', () => {
  it('compares products present in both inventories', () => {
    assert.deepEqual(gateModule.classifyInventory(['expo-a/A'], ['expo-a/A']), {
      additions: [],
      comparable: ['expo-a/A'],
    });
  });

  it('fails for a product present only in the baseline', () => {
    assert.throws(
      () => gateModule.classifyInventory(['expo-a/A'], []),
      /Baseline SwiftPM products disappeared: expo-a\/A/
    );
  });

  it('reports and permits a product present only in the current tree', () => {
    const comparison = gateModule.classifyInventory([], ['expo-new/New']);

    assert.deepEqual(comparison, { additions: ['expo-new/New'], comparable: [] });
    assert.equal(
      gateModule.formatInventoryAdditions(comparison.additions),
      'INFO: Current-only SwiftPM products (not compared): expo-new/New'
    );
  });

  it('carries a current-only product through the full gate without a baseline lookup', () => {
    assert.equal(
      sharedGateResult.status,
      0,
      `${sharedGateResult.stdout}\n${sharedGateResult.stderr}`
    );
    assert.match(
      sharedGateResult.stdout,
      /INFO: Current-only SwiftPM products \(not compared\): expo-asset\/Round6cAddedProduct/
    );
    assert.match(sharedGateResult.stdout, /PASS: 154 byte-identical manifests/);
  });

  it('fails the full gate when a baseline product disappears', () => {
    const result = runGate('production-depth', 'remove-product');

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /Baseline SwiftPM products disappeared: expo-asset\/ExpoAsset/
    );
  });
});

describe('collateral gate diagnostics and harness', () => {
  it('formats the unreachable-baseline error at the reachability check itself', () => {
    const missing = 'definitely-not-a-reachable-commit';
    assert.throws(
      () => gateModule.ensureBaselineReachable(missing),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.startsWith(
            `Unable to read SwiftPM manifest collateral baseline ${missing}.`
          )
        );
        assert.equal(error.stack, error.message, 'the known baseline error needs no stack trace');
        return true;
      }
    );
  });

  it('preserves stack traces for unexpected gate errors', () => {
    const result = spawnSync(process.execPath, [gate, '--exclude', 'round6d-missing/Product'], {
      cwd: repo,
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Exclusion does not name a real product: round6d-missing\/Product/);
    assert.match(result.stderr, /\n\s+at classifyInventory /);
  });

  it('fails legibly when the baseline commit is unreachable', () => {
    const missing = 'definitely-not-a-reachable-commit';
    const result = spawnSync(process.execPath, [gate, '--base', missing], {
      cwd: repo,
      encoding: 'utf8',
    });
    const output = `${result.stdout}\n${result.stderr}`;

    assert.notEqual(result.status, 0);
    assert.match(
      output,
      new RegExp(`Unable to read SwiftPM manifest collateral baseline ${missing}`)
    );
    assert.match(output, /shallow clone/i);
    assert.match(output, /fetch-depth: 0/);
    assert.doesNotMatch(output, /\n\s+at /, 'diagnostic must not include a stack trace');
  });
});
