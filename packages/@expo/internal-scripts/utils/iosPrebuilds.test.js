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

function flaggedFixture() {
  const root = fixture([{ name: 'ExpoOne', headersXCFramework: true }]);
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  framework(root, 'ExpoOneHeaders', 'headers');
  return root;
}

const REBUILD_HINT =
  'Run `et prebuild-package-for-publish` in this package to rebuild the prebuilds.';

function stagedHeadersTarball(root) {
  return path.join(root, 'prebuilds/output/headers/xcframeworks/ExpoOneHeaders.tar.gz');
}

function tarListing(tarball) {
  const listing = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  return listing.stdout.split('\n').filter(Boolean);
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
  const missing = path.join(root, '.expo-prebuild/output/debug/xcframeworks/ExpoTwo.xcframework');
  assert.throws(() => validateRawIosPrebuilds(root), {
    message: `ExpoTwo debug XCFramework is missing: ${missing}\n${REBUILD_HINT}`,
  });
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

test('staging removes stale prebuilds when the package stops publishing them', () => {
  const root = fixture();
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  assert.equal(stageIosPrebuilds(root), true);
  fs.writeFileSync(path.join(root, 'spm.config.json'), JSON.stringify({ products: [] }));
  assert.equal(stageIosPrebuilds(root), false);
  assert.equal(fs.existsSync(path.join(root, 'prebuilds')), false);
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

test('raw validation rejects an incomplete or missing headers XCFramework', () => {
  const root = flaggedFixture();
  const headers = path.join(
    root,
    '.expo-prebuild/output/headers/xcframeworks/ExpoOneHeaders.xcframework'
  );
  fs.rmSync(path.join(headers, 'Info.plist'));
  assert.throws(() => validateRawIosPrebuilds(root), {
    message: `ExpoOne headers XCFramework has no Info.plist: ${headers}\n${REBUILD_HINT}`,
  });
  fs.rmSync(headers, { recursive: true });
  assert.throws(() => validateRawIosPrebuilds(root), {
    message: `ExpoOne headers XCFramework is missing: ${headers}\n${REBUILD_HINT}`,
  });
});

test('stages a headers tarball beside the flavored tarballs for a flagged product', () => {
  const root = flaggedFixture();
  assert.equal(stageIosPrebuilds(root), true);
  assert.ok(
    tarListing(stagedHeadersTarball(root)).includes('ExpoOneHeaders.xcframework/Info.plist')
  );
  for (const flavor of ['debug', 'release']) {
    const entries = tarListing(
      path.join(root, 'prebuilds/output', flavor, 'xcframeworks/ExpoOne.tar.gz')
    );
    assert.ok(entries.includes('ExpoOne.xcframework/Info.plist'));
    assert.ok(entries.every((entry) => entry.startsWith('ExpoOne.xcframework')));
  }
});

test('published validation rejects a missing or wrong headers tarball', () => {
  const root = flaggedFixture();
  stageIosPrebuilds(root);
  const tarball = stagedHeadersTarball(root);
  fs.rmSync(tarball);
  assert.throws(() => validatePublishedIosPrebuilds(root), {
    message: `ExpoOne headers publish tarball is missing: ${tarball}`,
  });
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
  framework(root, 'ExpoOneHeaders', 'headers');
  assert.equal(stageIosPrebuilds(root), true);
  assert.equal(fs.existsSync(path.join(root, 'prebuilds/output/headers')), false);
});

const customBuild = { script: 'build.sh', output: 'Products/ExpoOne.xcframework' };

const ABI_FILE = 'arm64-apple-ios-simulator.abi.json';

function rawAbiFile(root, product) {
  return path.join(
    root,
    '.expo-prebuild/output/release/xcframeworks',
    `${product}.xcframework`,
    'ios-arm64_x86_64-simulator',
    `${product}.framework`,
    'Modules',
    `${product}.swiftmodule`,
    ABI_FILE
  );
}

function writeRawAbiFile(root, product) {
  const file = rawAbiFile(root, product);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `{"abi":"${product}"}`);
}

function abiFixture() {
  const root = fixture([
    { name: 'ExpoOne', headersXCFramework: true, customBuild, publishAbiDescriptor: true },
  ]);
  framework(root, 'ExpoOneHeaders', 'headers');
  return root;
}

test('stages the release simulator ABI file for a product with publishAbiDescriptor', () => {
  const root = abiFixture();
  writeRawAbiFile(root, 'ExpoOne');
  assert.equal(stageIosPrebuilds(root), true);
  assert.equal(
    fs.readFileSync(path.join(root, 'prebuilds/abi/ExpoOne', ABI_FILE), 'utf8'),
    '{"abi":"ExpoOne"}'
  );
  assert.equal(fs.existsSync(path.join(root, 'prebuilds/output/release')), false);
});

test('a customBuild product without publishAbiDescriptor neither stages nor requires an ABI file', () => {
  const root = fixture([{ name: 'ExpoOne', headersXCFramework: true, customBuild }]);
  framework(root, 'ExpoOneHeaders', 'headers');
  assert.equal(validateRawIosPrebuilds(root), true);
  assert.equal(stageIosPrebuilds(root), true);
  assert.equal(fs.existsSync(path.join(root, 'prebuilds/abi')), false);
});

test('throws when a product with publishAbiDescriptor has no release ABI file', () => {
  const root = abiFixture();
  assert.throws(() => validateRawIosPrebuilds(root), {
    message: `ExpoOne release ABI file is missing: ${rawAbiFile(root, 'ExpoOne')}\n${REBUILD_HINT}`,
  });
  assert.throws(() => stageIosPrebuilds(root), /arm64-apple-ios-simulator\.abi\.json/);
});

test('published validation rejects a missing staged ABI file', () => {
  const root = abiFixture();
  writeRawAbiFile(root, 'ExpoOne');
  stageIosPrebuilds(root);
  const staged = path.join(root, 'prebuilds/abi/ExpoOne', ABI_FILE);
  fs.rmSync(staged);
  assert.throws(() => validatePublishedIosPrebuilds(root), {
    message: `ExpoOne ABI file is missing: ${staged}`,
  });
});

test('a customBuild product stages only its headers tarball, never its built binaries', () => {
  const root = fixture([{ name: 'ExpoOne', headersXCFramework: true, customBuild }]);
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  framework(root, 'ExpoOneHeaders', 'headers');
  writeRawAbiFile(root, 'ExpoOne');
  assert.equal(validateRawIosPrebuilds(root), true);
  assert.equal(stageIosPrebuilds(root), true);
  assert.deepEqual(fs.readdirSync(path.join(root, 'prebuilds/output')), ['headers']);
  assert.ok(
    tarListing(stagedHeadersTarball(root)).includes('ExpoOneHeaders.xcframework/Info.plist')
  );
  assert.equal(validatePublishedIosPrebuilds(root), true);
});

test('a customBuild product that publishes prebuilds requires headersXCFramework', () => {
  const root = fixture([{ name: 'ExpoCustom', customBuild }]);
  const message =
    'ExpoCustom has a customBuild, and a custom-build product publishes only its headers ' +
    'XCFramework, so it needs "headersXCFramework": true in spm.config.json. Set it, or remove ' +
    '"publishPrebuilds" to stop publishing prebuilds for this package.';
  assert.throws(() => validateRawIosPrebuilds(root), { message });
  assert.throws(() => stageIosPrebuilds(root), { message });
  assert.throws(() => validatePublishedIosPrebuilds(root), { message });
});

test('a customBuild product skips its SPM dependencies unless another product shares them', () => {
  const root = fixture([
    {
      name: 'ExpoOne',
      headersXCFramework: true,
      customBuild,
      spmPackages: [{ productName: 'DepOnly' }, { productName: 'SharedDependency' }],
    },
    { name: 'ExpoTwo', spmPackages: [{ productName: 'SharedDependency' }] },
  ]);
  framework(root, 'ExpoOneHeaders', 'headers');
  writeRawAbiFile(root, 'ExpoOne');
  framework(root, 'ExpoTwo', 'debug');
  framework(root, 'ExpoTwo', 'release');
  framework(root, 'SharedDependency', 'debug');
  framework(root, 'SharedDependency', 'release');
  assert.equal(validateRawIosPrebuilds(root), true);
  assert.equal(stageIosPrebuilds(root), true);
  assert.equal(validatePublishedIosPrebuilds(root), true);
  assert.equal(fs.existsSync(path.join(root, 'prebuilds/spm-deps/DepOnly')), false);
  assert.equal(fs.existsSync(path.join(root, 'prebuilds/spm-deps/SharedDependency')), true);
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
      publishAbiDescriptor: true,
      spmPackages: [{ productName: 'DynamicDependency' }],
    },
  ]);
  framework(root, 'ExpoOne', 'debug');
  framework(root, 'ExpoOne', 'release');
  framework(root, 'ExpoOneHeaders', 'headers');
  framework(root, 'DynamicDependency', 'debug');
  framework(root, 'DynamicDependency', 'release');
  writeRawAbiFile(root, 'ExpoOne');
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
  assert.match(
    listing.stdout,
    /package\/prebuilds\/abi\/ExpoOne\/arm64-apple-ios-simulator\.abi\.json/
  );
  assert.doesNotMatch(listing.stdout, /\.expo-prebuild/);
});
