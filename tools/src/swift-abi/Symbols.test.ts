import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { NpmPack } from './Baseline';
import {
  findMissingSymbols,
  librariesToCheck,
  parseExports,
  parseImports,
  resolveModuleBinariesAsync,
} from './Symbols';

const IMPORTS = `
                 (undefined) external _$s10Foundation3URLV15ExpoModulesCore11AnyArgumentADWP (from ExpoModulesCore)
                 (undefined) weak external _$s15ExpoModulesCore6RecordPAAE6decode (from ExpoModulesCore)
                 (undefined) external _$s14ExpoModulesJSI15JavaScriptValueV (from ExpoModulesJSI)
                 (undefined) external _$s10Foundation3URLV14absoluteStringSSvg (from Foundation)
`;

const EXPORTS = `
0000000000111500 S _$s10Foundation3URLV15ExpoModulesCore11AnyArgumentADMc
000000000014aa50 S _$s10Foundation3URLV15ExpoModulesCore11AnyArgumentADWP
00000000001114f0 T _$s15ExpoModulesCore10AppContextC
`;

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'abi-symbols-'));
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

function addPrebuild(packageRoot: string, flavor: string, product: string) {
  const staging = tempDir();
  const binary = path.join(
    staging,
    `${product}.xcframework/ios-arm64_x86_64-simulator/${product}.framework/${product}`
  );
  fs.mkdirSync(path.dirname(binary), { recursive: true });
  fs.writeFileSync(binary, product);
  const xcframeworks = path.join(packageRoot, 'prebuilds/output', flavor, 'xcframeworks');
  fs.mkdirSync(xcframeworks, { recursive: true });
  tar([
    '-czf',
    path.join(xcframeworks, `${product}.tar.gz`),
    '-C',
    staging,
    `${product}.xcframework`,
  ]);
}

describe('parseImports', () => {
  it('keeps only symbols imported from the given library', () => {
    assert.deepEqual(
      [...parseImports(IMPORTS, 'ExpoModulesCore')],
      [
        '_$s10Foundation3URLV15ExpoModulesCore11AnyArgumentADWP',
        '_$s15ExpoModulesCore6RecordPAAE6decode',
      ]
    );
    assert.deepEqual(
      [...parseImports(IMPORTS, 'ExpoModulesJSI')],
      ['_$s14ExpoModulesJSI15JavaScriptValueV']
    );
  });
});

describe('parseExports', () => {
  it('reads every defined external symbol', () => {
    assert.deepEqual(
      [...parseExports(EXPORTS)],
      [
        '_$s10Foundation3URLV15ExpoModulesCore11AnyArgumentADMc',
        '_$s10Foundation3URLV15ExpoModulesCore11AnyArgumentADWP',
        '_$s15ExpoModulesCore10AppContextC',
      ]
    );
  });
});

describe('findMissingSymbols', () => {
  it('returns imported symbols the library no longer exports, sorted', () => {
    assert.deepEqual(
      findMissingSymbols(parseImports(IMPORTS, 'ExpoModulesCore'), parseExports(EXPORTS)),
      ['_$s15ExpoModulesCore6RecordPAAE6decode']
    );
  });
});

describe('resolveModuleBinariesAsync', () => {
  it('returns every product binary of the flavor', async () => {
    const packageRoot = path.join(tempDir(), 'package');
    addPrebuild(packageRoot, 'debug', 'ExpoCamera');
    addPrebuild(packageRoot, 'debug', 'ExpoCameraBarcodeScanning');
    addPrebuild(packageRoot, 'release', 'ExpoCamera');
    const result = await resolveModuleBinariesAsync(
      'expo-camera',
      '58.0.11',
      'debug',
      tempDir(),
      packFrom(packageRoot)
    );
    assert.equal(result.status, 'found');
    const binaries = result.status === 'found' ? result.binaries : [];
    assert.deepEqual(
      binaries.map(({ product }) => product),
      ['ExpoCamera', 'ExpoCameraBarcodeScanning']
    );
    for (const { product, binary } of binaries) {
      assert.equal(fs.readFileSync(binary, 'utf8'), product);
    }
  });

  it('reports a package without prebuilds', async () => {
    const packageRoot = path.join(tempDir(), 'package');
    fs.mkdirSync(packageRoot, { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'package.json'), '{}');
    assert.deepEqual(
      await resolveModuleBinariesAsync(
        'expo-location',
        '58.0.18',
        'release',
        tempDir(),
        packFrom(packageRoot)
      ),
      { status: 'none' }
    );
  });

  it('reports an unpublished version', async () => {
    assert.deepEqual(
      await resolveModuleBinariesAsync(
        'expo-font',
        '99.0.0',
        'release',
        tempDir(),
        async () => null
      ),
      { status: 'unpublished' }
    );
  });

  it('throws when a prebuild tarball has no simulator binary', async () => {
    const packageRoot = path.join(tempDir(), 'package');
    const staging = tempDir();
    fs.mkdirSync(path.join(staging, 'ExpoFont.xcframework/ios-arm64/ExpoFont.framework'), {
      recursive: true,
    });
    const xcframeworks = path.join(packageRoot, 'prebuilds/output/release/xcframeworks');
    fs.mkdirSync(xcframeworks, { recursive: true });
    tar([
      '-czf',
      path.join(xcframeworks, 'ExpoFont.tar.gz'),
      '-C',
      staging,
      'ExpoFont.xcframework',
    ]);
    await assert.rejects(
      resolveModuleBinariesAsync(
        'expo-font',
        '58.0.9',
        'release',
        tempDir(),
        packFrom(packageRoot)
      ),
      /expo-font@58\.0\.9 ExpoFont\.tar\.gz has no simulator binary/
    );
  });
});

describe('librariesToCheck', () => {
  it('checks a module against core and JSI', () => {
    assert.deepEqual(librariesToCheck('expo-font', 'ExpoFont'), [
      'ExpoModulesCore',
      'ExpoModulesJSI',
    ]);
  });

  it('checks the published core only against JSI', () => {
    assert.deepEqual(librariesToCheck('expo-modules-core', 'ExpoModulesCore'), ['ExpoModulesJSI']);
  });

  it('skips the other products in the core package', () => {
    assert.deepEqual(librariesToCheck('expo-modules-core', 'ExpoModulesWorklets'), []);
  });
});
