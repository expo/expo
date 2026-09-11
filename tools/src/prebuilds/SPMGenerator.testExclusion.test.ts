import fs from 'fs-extra';
import { glob } from 'glob';
import assert from 'node:assert/strict';
import os from 'node:os';
import { describe, it } from 'node:test';
import path from 'path';

import { getExpoRepositoryRootDir } from '../Directories';
import { getTargetExcludePatterns } from './SPMGenerator';

describe('getTargetExcludePatterns', () => {
  it('appends the default test exclusion to the target excludes', () => {
    assert.deepEqual(getTargetExcludePatterns({ exclude: ['barcode-scanning/**'] }), [
      'barcode-scanning/**',
      '**/Tests/**',
    ]);
  });

  it('excludes tests for a target without any excludes', () => {
    assert.deepEqual(getTargetExcludePatterns({}), ['**/Tests/**']);
  });

  it('keeps unit test sources out of a globbed source tree', async () => {
    const sourceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spm-test-exclusion-'));
    try {
      await fs.outputFile(path.join(sourceDir, 'Foo.swift'), 'struct Foo {}');
      await fs.outputFile(path.join(sourceDir, 'Tests', 'FooTests.swift'), 'import Testing');
      await fs.outputFile(path.join(sourceDir, 'Nested', 'Bar.swift'), 'struct Bar {}');
      await fs.outputFile(
        path.join(sourceDir, 'Nested', 'Tests', 'BarTests.swift'),
        'import Testing'
      );

      const files = await glob('**/*.swift', {
        cwd: sourceDir,
        ignore: getTargetExcludePatterns({}),
      });

      assert.deepEqual(files.sort(), ['Foo.swift', 'Nested/Bar.swift']);
    } finally {
      await fs.remove(sourceDir);
    }
  });
});

describe('expo-camera source selection', () => {
  it('excludes ios/Tests even though spm.config.json does not list it', async () => {
    const packagePath = path.join(getExpoRepositoryRootDir(), 'packages/expo-camera');
    const config = await fs.readJson(path.join(packagePath, 'spm.config.json'));
    const product = config.products.find(
      (candidate: { name: string }) => candidate.name === 'ExpoCamera'
    );
    assert.ok(product, 'expo-camera must declare an ExpoCamera product');
    const target = product.targets.find(
      (candidate: { type: string }) => candidate.type === 'swift'
    );
    assert.ok(target, 'expo-camera must declare a Swift target');
    assert.ok(
      !(target.exclude ?? []).includes('Tests/**'),
      'this regression test is pointless once the config excludes tests itself'
    );

    const files = await glob(target.pattern ?? '**/*.swift', {
      cwd: path.join(packagePath, target.path),
      ignore: getTargetExcludePatterns(target),
    });

    assert.deepEqual(
      files.filter((file) => file.startsWith('Tests/')),
      []
    );
    assert.ok(files.length > 0, 'expo-camera must still contribute Swift sources');
  });
});
