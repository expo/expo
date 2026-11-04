import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
  CORE_MODULE,
  isUnpublishedError,
  JSI_MODULE,
  NpmPack,
  resolveBaselineAbiAsync,
} from './Baseline';

const SLICE_ABI =
  'ios-arm64_x86_64-simulator/ExpoModulesCore.framework/Modules/ExpoModulesCore.swiftmodule/arm64-apple-ios-simulator.abi.json';

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'abi-baseline-'));
}

function tar(args: string[]) {
  const result = spawnSync('tar', args, {
    encoding: 'utf8',
    env: { ...process.env, COPYFILE_DISABLE: '1' },
  });
  assert.equal(result.status, 0, result.stderr);
}

function packFrom(packageRoot: string): NpmPack {
  return async (_spec, destination) => {
    const tarball = path.join(destination, 'package.tgz');
    tar(['-czf', tarball, '-C', path.dirname(packageRoot), path.basename(packageRoot)]);
    return tarball;
  };
}

function emptyPackage(): string {
  const packageRoot = path.join(tempDir(), 'package');
  fs.mkdirSync(path.join(packageRoot, 'prebuilds/output/headers/xcframeworks'), {
    recursive: true,
  });
  fs.writeFileSync(path.join(packageRoot, 'package.json'), '{}');
  return packageRoot;
}

function addStagedAbi(packageRoot: string, product: string, contents: string) {
  const abiDir = path.join(packageRoot, 'prebuilds/abi', product);
  fs.mkdirSync(abiDir, { recursive: true });
  fs.writeFileSync(path.join(abiDir, 'arm64-apple-ios-simulator.abi.json'), contents);
}

function addCoreReleaseTarball(packageRoot: string, contents: string) {
  const staging = tempDir();
  const sliceFile = path.join(staging, 'ExpoModulesCore.xcframework', SLICE_ABI);
  fs.mkdirSync(path.dirname(sliceFile), { recursive: true });
  fs.writeFileSync(sliceFile, contents);
  const xcframeworks = path.join(packageRoot, 'prebuilds/output/release/xcframeworks');
  fs.mkdirSync(xcframeworks, { recursive: true });
  tar([
    '-czf',
    path.join(xcframeworks, 'ExpoModulesCore.tar.gz'),
    '-C',
    staging,
    'ExpoModulesCore.xcframework',
  ]);
}

describe('resolveBaselineAbiAsync', () => {
  it('reports an unpublished version', async () => {
    const result = await resolveBaselineAbiAsync(
      CORE_MODULE,
      '99.0.0',
      tempDir(),
      async () => null
    );
    assert.deepEqual(result, { status: 'unpublished' });
  });

  it('reports a missing ABI file when the tarball has none', async () => {
    const result = await resolveBaselineAbiAsync(
      JSI_MODULE,
      '58.0.16',
      tempDir(),
      packFrom(emptyPackage())
    );
    assert.deepEqual(result, { status: 'missing' });
  });

  it('reports a missing ABI file for Core when the release tarball is gone', async () => {
    const result = await resolveBaselineAbiAsync(
      CORE_MODULE,
      '58.0.23',
      tempDir(),
      packFrom(emptyPackage())
    );
    assert.deepEqual(result, { status: 'missing' });
  });

  it('reads the staged ABI file for any module', async () => {
    for (const module of [JSI_MODULE, CORE_MODULE]) {
      const packageRoot = emptyPackage();
      addStagedAbi(packageRoot, module.productName, `{"staged":"${module.productName}"}`);
      const result = await resolveBaselineAbiAsync(
        module,
        '58.0.30',
        tempDir(),
        packFrom(packageRoot)
      );
      assert.equal(result.status, 'found');
      assert.equal(
        fs.readFileSync(result.status === 'found' ? result.path : '', 'utf8'),
        `{"staged":"${module.productName}"}`
      );
    }
  });

  it('falls back to the ABI file inside the release xcframework', async () => {
    const packageRoot = emptyPackage();
    addCoreReleaseTarball(packageRoot, '{"core":1}');
    const result = await resolveBaselineAbiAsync(
      CORE_MODULE,
      '58.0.23',
      tempDir(),
      packFrom(packageRoot)
    );
    assert.equal(result.status, 'found');
    const abiPath = result.status === 'found' ? result.path : '';
    assert.ok(abiPath.endsWith(path.join('ExpoModulesCore.xcframework', SLICE_ABI)), abiPath);
    assert.equal(fs.readFileSync(abiPath, 'utf8'), '{"core":1}');
  });
});

describe('isUnpublishedError', () => {
  it('treats a missing version or package as unpublished', () => {
    assert.equal(isUnpublishedError('npm error code ETARGET\nNo matching version found'), true);
    assert.equal(isUnpublishedError('npm error code E404\n404 Not Found'), true);
  });

  it('does not treat a network error as unpublished', () => {
    assert.equal(isUnpublishedError('npm error code ECONNRESET\nnetwork aborted'), false);
    assert.equal(isUnpublishedError('npm error code ENOTFOUND\ngetaddrinfo ENOTFOUND'), false);
  });
});
