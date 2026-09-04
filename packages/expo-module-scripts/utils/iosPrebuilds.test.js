import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  stageIosPrebuilds,
  validatePublishedIosPrebuilds,
  validateRawIosPrebuilds,
} from './iosPrebuilds.js';

function fixture(products = [{ name: 'ExpoOne' }]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-prebuilds-'));
  fs.writeFileSync(
    path.join(root, 'spm.config.json'),
    JSON.stringify({ publishPrebuilds: true, products })
  );
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'ios-prebuild-fixture', version: '1.0.0' })
  );
  return root;
}

function framework(root, product, flavor) {
  const output = path.join(
    root,
    '.expo-prebuild/output',
    flavor,
    'xcframeworks',
    `${product}.xcframework`
  );
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'Info.plist'), 'fixture');
}

test('raw validation rejects a missing flavor', () => {
  const root = fixture();
  framework(root, 'ExpoOne', 'debug');
  assert.throws(() => validateRawIosPrebuilds(root), /release XCFramework is missing/);
});

test('raw validation rejects a missing product', () => {
  const root = fixture([{ name: 'ExpoOne' }, { name: 'ExpoTwo' }]);
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  assert.throws(() => validateRawIosPrebuilds(root), /ExpoTwo debug XCFramework is missing/);
});

test('raw validation rejects a missing SPM runtime dependency', () => {
  const root = fixture([{ name: 'ExpoOne', spmPackages: [{ productName: 'DynamicDependency' }] }]);
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  assert.throws(
    () => validateRawIosPrebuilds(root),
    /DynamicDependency debug SPM dependency XCFramework is missing/
  );
});

test('staging fails when tar cannot be created', () => {
  const root = fixture();
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  assert.throws(
    () => stageIosPrebuilds(root, () => ({ status: 1, stderr: 'fixture failure' })),
    /fixture failure/
  );
});

test('stages and validates every product, dependency, and flavor', () => {
  const root = fixture([
    { name: 'ExpoOne', spmPackages: [{ productName: 'DynamicDependency' }] },
    { name: 'ExpoTwo' },
  ]);
  for (const product of ['ExpoOne', 'ExpoTwo']) {
    for (const flavor of ['debug', 'release']) framework(root, product, flavor);
  }
  for (const flavor of ['debug', 'release']) framework(root, 'DynamicDependency', flavor);
  assert.equal(stageIosPrebuilds(root), true);
  assert.equal(validatePublishedIosPrebuilds(root), true);
  assert.equal(
    fs.existsSync(
      path.join(
        root,
        'prebuilds/spm-deps/DynamicDependency/debug/DynamicDependency.xcframework/Info.plist'
      )
    ),
    true
  );
});

test('non-publishing packages are lifecycle no-ops', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-prebuilds-'));
  fs.writeFileSync(path.join(root, 'spm.config.json'), JSON.stringify({ products: [] }));
  assert.equal(validateRawIosPrebuilds(root), false);
  assert.equal(stageIosPrebuilds(root), false);
});

test('the JavaScript clean step preserves raw iOS outputs', () => {
  const root = fixture();
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  const clean = spawnSync(
    process.execPath,
    [path.join(import.meta.dirname, '../bin/expo-module-clean')],
    { cwd: root, encoding: 'utf8' }
  );
  assert.equal(clean.status, 0, clean.stderr);
  assert.equal(fs.existsSync(path.join(root, 'build')), false);
  assert.equal(validateRawIosPrebuilds(root), true);
});

test('pnpm pack includes staging tarballs and excludes raw outputs', () => {
  const root = fixture([{ name: 'ExpoOne', spmPackages: [{ productName: 'DynamicDependency' }] }]);
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  framework(root, 'DynamicDependency', 'debug');
  framework(root, 'DynamicDependency', 'release');
  fs.writeFileSync(path.join(root, '.npmignore'), '/.*/\n/*.tgz\n');
  stageIosPrebuilds(root);
  const packed = spawnSync('pnpm', ['pack'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, npm_config_ignore_scripts: 'true' },
  });
  assert.equal(packed.status, 0, packed.stderr);
  const archive = path.join(root, 'ios-prebuild-fixture-1.0.0.tgz');
  const listing = spawnSync('tar', ['-tzf', archive], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  assert.match(listing.stdout, /package\/prebuilds\/output\/debug\/xcframeworks\/ExpoOne\.tar\.gz/);
  assert.match(
    listing.stdout,
    /package\/prebuilds\/spm-deps\/DynamicDependency\/release\/DynamicDependency\.xcframework\/Info\.plist/
  );
  assert.doesNotMatch(listing.stdout, /\.expo-prebuild/);
});
