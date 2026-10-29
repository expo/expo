import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, it } from 'node:test';

import type { SPMPackageSource } from './ExternalPackage';
import type { SPMProduct, SwiftTarget } from './SPMConfig.types';
import { SPMGenerator } from './SPMGenerator';

const temporaryDirectories: string[] = [];
const originalRepoRoot = process.env.EXPO_ROOT_DIR;

afterEach(() => {
  if (originalRepoRoot === undefined) delete process.env.EXPO_ROOT_DIR;
  else process.env.EXPO_ROOT_DIR = originalRepoRoot;
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

/** A package with no checked-in Package.swift, whose single target omits `path` — the mistake a
 * half-finished conversion leaves behind, now that the schema no longer requires `path`. */
function fixtureWithoutTargetPath() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-missing-target-path-'));
  temporaryDirectories.push(repoRoot);
  process.env.EXPO_ROOT_DIR = repoRoot;
  const root = path.join(repoRoot, 'packages/fixture');
  fs.mkdirSync(path.join(root, 'ios'), { recursive: true });
  fs.writeFileSync(path.join(root, 'ios/Main.swift'), 'public let value = 1');

  // A converted package's spm.config.json carries no `path`; `SourceTarget.path` is optional.
  const target: SwiftTarget = { type: 'swift', name: 'Main' };

  const product: SPMProduct = {
    name: 'Fixture',
    podName: 'Fixture',
    platforms: ['iOS("16.4")'],
    targets: [target],
  };
  const pkg: SPMPackageSource = {
    path: root,
    buildPath: path.join(root, '.build-prebuild'),
    packageName: 'fixture',
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: () => ({ products: [product] }),
  };
  return { root, product, pkg };
}

it('explains a target with no path in a package with no checked-in manifest', async () => {
  const { root, product, pkg } = fixtureWithoutTargetPath();
  await assert.rejects(
    SPMGenerator.generateIsolatedSourcesForTargetsAsync(pkg, product),
    (error: Error) => {
      assert.ok(!(error instanceof TypeError), `Expected a diagnostic, got ${error.stack}`);
      assert.match(error.message, /product "Fixture", target "Main"/);
      assert.match(error.message, /no "path"/);
      assert.match(error.message, /Package\.swift/);
      assert.ok(
        error.message.includes(root),
        `Error must say where the manifest belongs: ${error.message}`
      );
      assert.match(error.message, /spm\.config\.json/);
      return true;
    }
  );
});
