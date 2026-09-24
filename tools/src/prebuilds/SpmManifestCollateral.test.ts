import assert from 'node:assert/strict';
import { execFileSync, spawnSync, type SpawnSyncReturns } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';

/** Compiled to `build/prebuilds/`, so `tools/` is two levels up. */
const toolsDir = path.resolve(__dirname, '../..');
const gate = path.join(toolsDir, 'scripts', 'check-spm-manifest-collateral.cjs');

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
  changedProducts: (
    baseline: ReadonlyMap<string, unknown>,
    current: ReadonlyMap<string, unknown>
  ) => string[];
  formatInventoryAdditions: (additions: string[]) => string | undefined;
  formatChangedProducts: (changed: string[]) => string | undefined;
};

type Product = { name: string; [field: string]: unknown };

/** Package directory under `packages/` → the products of its `spm.config.json`. */
type Packages = Record<string, Product[]>;

function product(
  name: string,
  overrides: Partial<Product> = {},
  targetOverrides: Record<string, unknown> = {}
): Product {
  return {
    name,
    podName: name,
    platforms: ['iOS("16.4")'],
    externalDependencies: [],
    targets: [
      {
        type: 'objc',
        name,
        path: 'ios',
        pattern: '**/*.m',
        headerPattern: '**/*.h',
        dependencies: [],
        linkedFrameworks: ['Foundation'],
        includeDirectories: ['.'],
        ...targetOverrides,
      },
    ],
    ...overrides,
  };
}

/** `fixture-consumer` depends on `fixture-core`, so the core's config is an input of both. */
function basePackages(): Packages {
  return {
    'fixture-core': [product('FixtureCore')],
    'fixture-consumer': [
      product('FixtureConsumer', { externalDependencies: ['fixture-core/FixtureCore'] }),
    ],
    'fixture-leaf': [product('FixtureLeaf')],
  };
}

const fixtureRoots: string[] = [];
after(() => {
  for (const root of fixtureRoots) fs.rmSync(root, { recursive: true, force: true });
});

function git(root: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'core.fsmonitor=false',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.com',
      ...args,
    ],
    { cwd: root, encoding: 'utf8' }
  ).trim();
}

function writePackages(root: string, packages: Packages): void {
  for (const [directory, products] of Object.entries(packages)) {
    const packageRoot = path.join(root, 'packages', directory);
    fs.mkdirSync(path.join(packageRoot, 'ios'), { recursive: true });
    fs.writeFileSync(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: directory, version: '1.0.0' })
    );
    fs.writeFileSync(
      path.join(packageRoot, 'spm.config.json'),
      JSON.stringify({ products }, null, 2)
    );
    fs.writeFileSync(path.join(packageRoot, 'ios', 'Fixture.h'), '');
    fs.writeFileSync(path.join(packageRoot, 'ios', 'Fixture.m'), '');
  }
}

type FixtureOptions = {
  base?: Packages;
  editHead?: (packages: Packages) => void;
  /** Edits the head commit's copy of `tools/src`, given its path. */
  editHeadTools?: (toolsSrc: string) => void;
  /** Packages given a root `Package.swift` in the head commit, which opts them in. */
  optInAtHead?: string[];
};

/**
 * A git repository whose base commit holds `base` and whose head commit (and working tree) holds
 * `base` changed by `editHead`. Both commits carry this checkout's `tools/src`, so the gate drives
 * the real generator on both sides and any difference comes from the packages alone.
 */
function fixtureRepo({
  base = basePackages(),
  editHead = () => {},
  editHeadTools = () => {},
  optInAtHead = [],
}: FixtureOptions = {}): { root: string; baseCommit: string } {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spm-collateral-fixture-')));
  fixtureRoots.push(root);
  fs.cpSync(path.join(toolsDir, 'src'), path.join(root, 'tools/src'), { recursive: true });
  fs.symlinkSync(path.join(toolsDir, 'node_modules'), path.join(root, 'tools/node_modules'));
  fs.writeFileSync(path.join(root, '.gitignore'), 'node_modules\n');
  writePackages(root, base);
  git(root, 'init', '--quiet');
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '--message', 'base');
  const baseCommit = git(root, 'rev-parse', 'HEAD');

  editHeadTools(path.join(root, 'tools/src'));
  const head = structuredClone(base);
  editHead(head);
  fs.rmSync(path.join(root, 'packages'), { recursive: true, force: true });
  writePackages(root, head);
  for (const directory of optInAtHead) {
    fs.writeFileSync(
      path.join(root, 'packages', directory, 'Package.swift'),
      '// swift-tools-version: 5.9\n'
    );
  }
  git(root, 'add', '--all');
  git(root, 'commit', '--quiet', '--allow-empty', '--message', 'head');
  return { root, baseCommit };
}

function runGate(root: string, base: string, ...args: string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [gate, '--repo', root, '--base', base, ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
}

function output(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

/** The manifest count on the PASS line, so a gate that compared nothing cannot pass. */
function comparedManifests(result: SpawnSyncReturns<string>): number {
  const match = result.stdout.match(/PASS: (\d+) byte-identical manifests across (\d+) products/);
  assert.ok(match, `expected a PASS line:\n${output(result)}`);
  assert.equal(Number(match[1]), Number(match[2]) * 2, 'every product has a Debug and a Release');
  return Number(match[2]);
}

/**
 * Runs the collateral gate, which regenerates every product's `Package.swift` at the baseline
 * commit and on the working tree and requires the two to be byte-identical. It is half the
 * acceptance criterion of every SwiftPM migration step: the packages *not* being migrated must
 * emit exactly what they emitted before.
 */
describe('check-spm-manifest-collateral', () => {
  it('passes when nothing changed, having compared every product', () => {
    const { root, baseCommit } = fixtureRepo();
    const result = runGate(root, baseCommit);

    assert.equal(result.status, 0, output(result));
    assert.equal(comparedManifests(result), 3);
  });

  it('excludes a product whose own config entry changed, and says so', () => {
    const { root, baseCommit } = fixtureRepo({
      editHead: (packages) => {
        packages['fixture-leaf'] = [product('FixtureLeaf', { podName: 'RenamedFixtureLeaf' })];
      },
    });
    const result = runGate(root, baseCommit);

    assert.equal(result.status, 0, output(result));
    assert.match(
      result.stdout,
      /INFO: .*changed spm\.config\.json entry.*: fixture-leaf\/FixtureLeaf\n/
    );
    assert.equal(comparedManifests(result), 2);
  });

  it('fails on a product whose manifest changed because a dependency config changed', () => {
    const { root, baseCommit } = fixtureRepo({
      editHead: (packages) => {
        packages['fixture-core'] = [
          product('FixtureCore', { externalDependencies: ['fixture-leaf/FixtureLeaf'] }),
        ];
      },
    });
    const result = runGate(root, baseCommit);

    assert.equal(result.status, 1, output(result));
    assert.match(
      result.stdout,
      /INFO: .*changed spm\.config\.json entry.*: fixture-core\/FixtureCore\n/
    );
    assert.match(result.stderr, /DIFF: fixture-consumer\/FixtureConsumer\/Debug/);
    assert.match(result.stderr, /Collateral manifest changes/);
    assert.doesNotMatch(result.stderr, /DIFF: fixture-core\//);
  });

  it('fails on every product whose manifest a head-side generator change altered', () => {
    const { root, baseCommit } = fixtureRepo({
      editHeadTools: (toolsSrc) => {
        const generator = path.join(toolsSrc, 'prebuilds/SPMPackage.ts');
        const source = fs.readFileSync(generator, 'utf8');
        const edited = source.replace(
          "lines.push('import PackageDescription');",
          "lines.push('import PackageDescription // edited at head');"
        );
        assert.notEqual(edited, source, 'the fixture edit must reach the generator');
        fs.writeFileSync(generator, edited);
      },
    });
    const result = runGate(root, baseCommit);

    assert.equal(result.status, 1, output(result));
    for (const id of [
      'fixture-consumer/FixtureConsumer',
      'fixture-core/FixtureCore',
      'fixture-leaf/FixtureLeaf',
    ]) {
      for (const flavor of ['Debug', 'Release']) {
        assert.match(result.stderr, new RegExp(`DIFF: ${id}/${flavor}\n`));
      }
    }
    assert.match(result.stderr, /Collateral manifest changes/);
  });

  it('fails loudly when two config entries claim the same product', () => {
    const { root, baseCommit } = fixtureRepo({
      editHead: (packages) => {
        packages['fixture-leaf'].push(product('FixtureLeaf', { podName: 'Duplicate' }));
      },
    });
    const result = runGate(root, baseCommit);

    assert.equal(result.status, 1, output(result));
    assert.match(result.stderr, /fixture-leaf\/FixtureLeaf/);
    assert.match(result.stderr, /packages\/fixture-leaf\/spm\.config\.json/);
    assert.match(result.stderr, /Why:/);
    assert.match(result.stderr, /How to fix:/);
  });

  it('skips a package with a root Package.swift without also reporting its config change', () => {
    const { root, baseCommit } = fixtureRepo({
      editHead: (packages) => {
        packages['fixture-leaf'] = [product('FixtureLeaf', { podName: 'RenamedFixtureLeaf' })];
      },
      optInAtHead: ['fixture-leaf'],
    });
    const result = runGate(root, baseCommit);

    assert.equal(result.status, 0, output(result));
    assert.match(
      result.stdout,
      /INFO: Skipped 1 opted-in SwiftPM packages \(not compared\): fixture-leaf\n/
    );
    assert.doesNotMatch(result.stdout, /changed spm\.config\.json entry/);
    assert.equal(comparedManifests(result), 2);
  });

  it('honors an explicit --exclude', () => {
    const { root, baseCommit } = fixtureRepo();
    const result = runGate(root, baseCommit, '--exclude', 'fixture-leaf/FixtureLeaf');

    assert.equal(result.status, 0, output(result));
    assert.match(result.stdout, /1 explicit exclusions/);
    assert.equal(comparedManifests(result), 2);
  });

  it('reports a product present only in the head, and compares the rest', () => {
    const { root, baseCommit } = fixtureRepo({
      editHead: (packages) => {
        packages['fixture-leaf'].push(product('FixtureAddition'));
      },
    });
    const result = runGate(root, baseCommit);

    assert.equal(result.status, 0, output(result));
    assert.match(
      result.stdout,
      /INFO: Current-only SwiftPM products \(not compared\): fixture-leaf\/FixtureAddition/
    );
    assert.equal(comparedManifests(result), 3);
  });

  it('fails when a baseline product disappears', () => {
    const { root, baseCommit } = fixtureRepo({
      editHead: (packages) => {
        delete packages['fixture-leaf'];
      },
    });
    const result = runGate(root, baseCommit);

    assert.notEqual(result.status, 0);
    assert.match(
      output(result),
      /Baseline SwiftPM products disappeared: fixture-leaf\/FixtureLeaf/
    );
  });

  it('fails when a generated manifest contains the reserved normalization marker', () => {
    const marked = basePackages();
    marked['fixture-leaf'] = [product('FixtureLeaf', {}, { linkerFlags: ['<EXPO_ROOT_DIR>'] })];
    const { root, baseCommit } = fixtureRepo({ base: marked });
    const result = runGate(root, baseCommit);

    assert.equal(result.status, 1, output(result));
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

  it('leaves excluded products out of both additions and comparisons', () => {
    assert.deepEqual(
      gateModule.classifyInventory(
        ['expo-a/A', 'expo-b/B'],
        ['expo-a/A', 'expo-b/B', 'expo-c/C'],
        new Set(['expo-b/B', 'expo-c/C'])
      ),
      { additions: [], comparable: ['expo-a/A'] }
    );
  });
});

describe('changedProducts', () => {
  it('names each product whose own config entry differs, sorted', () => {
    const baseline = new Map<string, unknown>([
      ['expo-b/B', { name: 'B', podName: 'B' }],
      ['expo-a/A', { name: 'A', linkedFrameworks: ['Foundation'] }],
      ['expo-c/C', { name: 'C' }],
    ]);
    const current = new Map<string, unknown>([
      ['expo-b/B', { name: 'B', podName: 'Renamed' }],
      ['expo-a/A', { name: 'A', linkedFrameworks: ['Foundation', 'UIKit'] }],
      ['expo-c/C', { name: 'C' }],
    ]);

    assert.deepEqual(gateModule.changedProducts(baseline, current), ['expo-a/A', 'expo-b/B']);
  });

  it('treats a reordering of keys as no change', () => {
    assert.deepEqual(
      gateModule.changedProducts(
        new Map([['expo-a/A', { name: 'A', podName: 'A' }]]),
        new Map([['expo-a/A', { podName: 'A', name: 'A' }]])
      ),
      []
    );
  });

  it('ignores products on one side only, which the inventory accounts for', () => {
    assert.deepEqual(
      gateModule.changedProducts(
        new Map([['expo-gone/Gone', { name: 'Gone' }]]),
        new Map([['expo-new/New', { name: 'New' }]])
      ),
      []
    );
  });

  it('formats the exclusion with the reason, and nothing when none changed', () => {
    assert.equal(gateModule.formatChangedProducts([]), undefined);
    assert.match(
      gateModule.formatChangedProducts(['expo-a/A', 'expo-b/B']) ?? '',
      /^INFO: .*changed spm\.config\.json entry.*: expo-a\/A, expo-b\/B$/
    );
  });
});

describe('collateral gate diagnostics and harness', () => {
  it('requires callers to choose an explicit baseline', () => {
    const result = spawnSync(process.execPath, [gate], { encoding: 'utf8' });

    assert.notEqual(result.status, 0);
    assert.match(output(result), /--base/);
    assert.match(output(result), /explicit baseline commit/i);
    assert.match(output(result), /Why:/);
    assert.match(output(result), /git merge-base origin\/main HEAD/);
    assert.doesNotMatch(output(result), /\n\s+at /, 'diagnostic must not include a stack trace');
  });

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
    const { root, baseCommit } = fixtureRepo();
    const result = runGate(root, baseCommit, '--exclude', 'missing/Product');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Exclusion does not name a real product: missing\/Product/);
    assert.match(result.stderr, /\n\s+at classifyInventory /);
  });

  it('fails legibly when the baseline commit is unreachable', () => {
    const { root } = fixtureRepo();
    const missing = 'definitely-not-a-reachable-commit';
    const result = runGate(root, missing);

    assert.notEqual(result.status, 0);
    assert.match(
      output(result),
      new RegExp(`Unable to read SwiftPM manifest collateral baseline ${missing}`)
    );
    assert.match(output(result), /shallow clone/i);
    assert.match(output(result), /fetch-depth: 0/);
    assert.doesNotMatch(output(result), /\n\s+at /, 'diagnostic must not include a stack trace');
  });
});
