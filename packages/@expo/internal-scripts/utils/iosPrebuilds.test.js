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

function headersFramework(root, product, { infoPlist = true } = {}) {
  const output = path.join(root, rawHeadersPath(product));
  fs.mkdirSync(output, { recursive: true });
  if (infoPlist) fs.writeFileSync(path.join(output, 'Info.plist'), 'fixture');
}

function rawHeadersPath(product) {
  return `.expo-prebuild/output/headers/xcframeworks/${product}Headers.xcframework`;
}

function stagedHeadersTarball(root, product) {
  return path.join(root, 'prebuilds/output/headers/xcframeworks', `${product}Headers.tar.gz`);
}

function tarListing(tarball) {
  const listing = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  return listing.stdout.split('\n').filter(Boolean);
}

function flaggedFixture() {
  const root = fixture([{ name: 'ExpoOne', headersXCFramework: true }]);
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  return root;
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

test('raw validation rejects a missing headers XCFramework for a flagged product', () => {
  const root = flaggedFixture();
  assert.throws(
    () => validateRawIosPrebuilds(root),
    (error) =>
      /ExpoOne headers XCFramework is missing/.test(error.message) &&
      error.message.includes(path.join(root, rawHeadersPath('ExpoOne'))) &&
      error.message.includes('et prebuild-package-for-publish')
  );
});

test('raw validation rejects a headers XCFramework without Info.plist', () => {
  const root = flaggedFixture();
  headersFramework(root, 'ExpoOne', { infoPlist: false });
  assert.throws(
    () => validateRawIosPrebuilds(root),
    (error) =>
      /ExpoOne headers XCFramework has no Info\.plist/.test(error.message) &&
      error.message.includes(path.join(root, rawHeadersPath('ExpoOne')))
  );
});

test('stages a headers tarball beside the flavored tarballs for a flagged product', () => {
  const root = flaggedFixture();
  headersFramework(root, 'ExpoOne');
  assert.equal(stageIosPrebuilds(root), true);
  assert.ok(
    tarListing(stagedHeadersTarball(root, 'ExpoOne')).some((entry) =>
      entry.startsWith('ExpoOneHeaders.xcframework/')
    )
  );
  for (const flavor of ['debug', 'release']) {
    const entries = tarListing(
      path.join(root, 'prebuilds/output', flavor, 'xcframeworks/ExpoOne.tar.gz')
    );
    assert.ok(entries.includes('ExpoOne.xcframework/Info.plist'));
    assert.ok(entries.every((entry) => entry.startsWith('ExpoOne.xcframework')));
  }
});

test('published validation rejects a missing headers tarball for a flagged product', () => {
  const root = flaggedFixture();
  headersFramework(root, 'ExpoOne');
  stageIosPrebuilds(root);
  const tarball = stagedHeadersTarball(root, 'ExpoOne');
  fs.rmSync(tarball);
  assert.throws(
    () => validatePublishedIosPrebuilds(root),
    (error) =>
      /ExpoOne headers publish tarball is missing/.test(error.message) &&
      error.message.includes(tarball)
  );
});

test('published validation rejects a headers tarball without the headers XCFramework', () => {
  const root = flaggedFixture();
  headersFramework(root, 'ExpoOne');
  stageIosPrebuilds(root);
  const tarball = stagedHeadersTarball(root, 'ExpoOne');
  const created = spawnSync(
    'tar',
    ['-czf', tarball, '-C', path.join(root, '.expo-prebuild/output/debug/xcframeworks'), '.'],
    { encoding: 'utf8' }
  );
  assert.equal(created.status, 0, created.stderr);
  assert.throws(
    () => validatePublishedIosPrebuilds(root),
    /does not contain ExpoOneHeaders\.xcframework/
  );
});

test('products without headersXCFramework neither stage nor require a headers tarball', () => {
  const root = fixture();
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  headersFramework(root, 'ExpoOne');
  assert.equal(stageIosPrebuilds(root), true);
  assert.equal(fs.existsSync(path.join(root, 'prebuilds/output/headers')), false);
  assert.equal(validatePublishedIosPrebuilds(root), true);
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
  const root = fixture([
    {
      name: 'ExpoOne',
      headersXCFramework: true,
      spmPackages: [{ productName: 'DynamicDependency' }],
    },
  ]);
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  headersFramework(root, 'ExpoOne');
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
  assert.match(
    listing.stdout,
    /package\/prebuilds\/output\/headers\/xcframeworks\/ExpoOneHeaders\.tar\.gz/
  );
  assert.doesNotMatch(listing.stdout, /\.expo-prebuild/);
});
