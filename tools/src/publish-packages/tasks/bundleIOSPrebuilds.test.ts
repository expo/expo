import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  cleanStaleModuleBuildDirsAsync,
  clearBundledPrebuildsAsync,
  ensureSupportedToolchainAsync,
  parseXcodeVersion,
  SUPPORTED_XCODE_VERSION,
} from './bundleIOSPrebuilds';

describe('parseXcodeVersion', () => {
  it('parses a normal `xcodebuild -version` output', () => {
    assert.equal(parseXcodeVersion('Xcode 26.4.1\nBuild version 16A5318g\n'), '26.4.1');
  });

  it('normalizes a major-only Xcode version to major.minor.patch', () => {
    assert.equal(parseXcodeVersion('Xcode 26\nBuild version 16A5318g\n'), '26.0.0');
  });

  it('normalizes a major.minor Xcode version to major.minor.patch', () => {
    assert.equal(parseXcodeVersion('Xcode 26.4\n'), '26.4.0');
  });

  it('returns null when the expected prefix is missing', () => {
    assert.equal(parseXcodeVersion('something else entirely'), null);
  });
});

describe('ensureSupportedToolchainAsync', () => {
  let previousDeveloperDir: string | undefined;

  beforeEach(() => {
    previousDeveloperDir = process.env.DEVELOPER_DIR;
  });

  afterEach(() => {
    if (previousDeveloperDir === undefined) {
      delete process.env.DEVELOPER_DIR;
    } else {
      process.env.DEVELOPER_DIR = previousDeveloperDir;
    }
  });

  it('does not touch DEVELOPER_DIR when active toolchain matches', async () => {
    delete process.env.DEVELOPER_DIR;
    const restore = await ensureSupportedToolchainAsync(
      async () => SUPPORTED_XCODE_VERSION,
      async () => []
    );
    assert.equal(process.env.DEVELOPER_DIR, undefined);
    restore();
    assert.equal(process.env.DEVELOPER_DIR, undefined);
  });

  it('sets DEVELOPER_DIR when switching, and unsets it on restore', async () => {
    delete process.env.DEVELOPER_DIR;
    const restore = await ensureSupportedToolchainAsync(
      async () => '26.2',
      async () => [
        {
          developerDir: '/Applications/Xcode_26.4.1.app/Contents/Developer',
          xcode: SUPPORTED_XCODE_VERSION,
        },
      ]
    );
    assert.equal(process.env.DEVELOPER_DIR, '/Applications/Xcode_26.4.1.app/Contents/Developer');
    restore();
    assert.equal(process.env.DEVELOPER_DIR, undefined);
  });

  it('preserves a prior DEVELOPER_DIR value across switch + restore', async () => {
    const prior = '/Applications/Xcode_27.0.app/Contents/Developer';
    process.env.DEVELOPER_DIR = prior;
    const restore = await ensureSupportedToolchainAsync(
      async () => '27.0',
      async () => [
        {
          developerDir: '/Applications/Xcode_26.4.1.app/Contents/Developer',
          xcode: SUPPORTED_XCODE_VERSION,
        },
      ]
    );
    assert.equal(process.env.DEVELOPER_DIR, '/Applications/Xcode_26.4.1.app/Contents/Developer');
    restore();
    assert.equal(process.env.DEVELOPER_DIR, prior);
  });

  it('throws with a what/why/how message when no supported toolchain is available', async () => {
    delete process.env.DEVELOPER_DIR;
    await assert.rejects(
      ensureSupportedToolchainAsync(
        async () => '26.2',
        async () => []
      ),
      (err: Error) => {
        assert.match(err.message, /Active toolchain is Xcode 26\.2/);
        assert.match(err.message, new RegExp(`Xcode ${SUPPORTED_XCODE_VERSION}`));
        assert.match(err.message, /No Xcode-shaped apps found in \/Applications/);
        assert.match(err.message, /developer\.apple\.com/);
        assert.match(err.message, /--skip-ios-prebuilds/);
        return true;
      }
    );
    assert.equal(process.env.DEVELOPER_DIR, undefined);
  });

  it('lists discovered Xcodes in the throw message when none match', async () => {
    delete process.env.DEVELOPER_DIR;
    await assert.rejects(
      ensureSupportedToolchainAsync(
        async () => '26.2',
        async () => [
          {
            developerDir: '/Applications/Xcode_26.2.app/Contents/Developer',
            xcode: '26.2',
          },
          {
            developerDir: '/Applications/Xcode_15.4.app/Contents/Developer',
            xcode: '15.4',
          },
        ]
      ),
      (err: Error) => {
        assert.match(err.message, /Found in \/Applications/);
        assert.match(err.message, /Xcode 26\.2 at \/Applications\/Xcode_26\.2\.app/);
        assert.match(err.message, /Xcode 15\.4 at \/Applications\/Xcode_15\.4\.app/);
        return true;
      }
    );
  });

  it('does not mutate DEVELOPER_DIR when the throw path is taken', async () => {
    const prior = '/Applications/Xcode_27.0.app/Contents/Developer';
    process.env.DEVELOPER_DIR = prior;
    await assert.rejects(
      ensureSupportedToolchainAsync(
        async () => '27.0',
        async () => []
      )
    );
    assert.equal(process.env.DEVELOPER_DIR, prior);
  });
});

describe('cleanStaleModuleBuildDirsAsync', () => {
  let buildDir: string;

  beforeEach(() => {
    buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuild-clean-'));
  });

  afterEach(() => {
    fs.rmSync(buildDir, { recursive: true, force: true });
  });

  const mkdir = (name: string) => fs.mkdirSync(path.join(buildDir, name), { recursive: true });
  const exists = (name: string) => fs.existsSync(path.join(buildDir, name));
  const confirmYes = async () => true;
  const confirmNo = async () => false;

  it('removes every module build dir but preserves dot-prefixed shared caches', async () => {
    mkdir('expo-modules-core/output/debug/xcframeworks');
    mkdir('expo-sensors/output/release/frameworks');
    mkdir('@expo/ui/output/debug/xcframeworks'); // scoped module dir
    mkdir('.spm-deps/SDWebImage'); // shared SPM dep cache — must survive

    await cleanStaleModuleBuildDirsAsync(buildDir, confirmYes);

    assert.equal(exists('expo-modules-core'), false);
    assert.equal(exists('expo-sensors'), false);
    assert.equal(exists('@expo'), false);
    assert.equal(exists('.spm-deps'), true);
    assert.equal(exists('.spm-deps/SDWebImage'), true);
  });

  it('leaves everything in place when the prompt is declined', async () => {
    mkdir('expo-modules-core/output/debug/xcframeworks');

    await cleanStaleModuleBuildDirsAsync(buildDir, confirmNo);

    assert.equal(exists('expo-modules-core'), true);
  });

  it('does not prompt when there are no module dirs to remove', async () => {
    mkdir('.spm-deps/libavif'); // only a shared cache present
    let prompted = false;
    await cleanStaleModuleBuildDirsAsync(buildDir, async () => {
      prompted = true;
      return true;
    });
    assert.equal(prompted, false);
    assert.equal(exists('.spm-deps/libavif'), true);
  });

  it('is a no-op when the build dir does not exist', async () => {
    const missing = path.join(buildDir, 'does-not-exist');
    await assert.doesNotReject(cleanStaleModuleBuildDirsAsync(missing, confirmYes));
  });
});

describe('clearBundledPrebuildsAsync', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuild-bundled-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  // A parcel whose package lives at <root>/<name>, seeded with the given subdirs.
  const parcel = (name: string, subdirs: string[]): any => {
    const pkgPath = path.join(root, name);
    for (const sub of subdirs) {
      fs.mkdirSync(path.join(pkgPath, sub), { recursive: true });
    }
    return { pkg: { packageName: name, packageSlug: name, path: pkgPath } };
  };
  const has = (name: string, sub: string) => fs.existsSync(path.join(root, name, sub));

  it('removes prebuilds/ from every package, listed or not, leaving other files intact', async () => {
    const listed = parcel('expo-image', ['prebuilds/output/debug/xcframeworks', 'ios']);
    const delisted = parcel('expo-sensors', ['prebuilds/output/release/xcframeworks', 'ios']);

    await clearBundledPrebuildsAsync([listed, delisted]);

    assert.equal(has('expo-image', 'prebuilds'), false);
    assert.equal(has('expo-sensors', 'prebuilds'), false);
    // Non-prebuilds package contents are untouched.
    assert.equal(has('expo-image', 'ios'), true);
    assert.equal(has('expo-sensors', 'ios'), true);
  });

  it('is a no-op when no package has a prebuilds/ dir', async () => {
    const p = parcel('expo-crypto', ['ios']);
    await assert.doesNotReject(clearBundledPrebuildsAsync([p]));
    assert.equal(has('expo-crypto', 'ios'), true);
  });
});
