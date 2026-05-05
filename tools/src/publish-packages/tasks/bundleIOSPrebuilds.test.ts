import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  ensureSupportedToolchainAsync,
  parseXcodeVersion,
  SUPPORTED_XCODE_VERSION,
} from './bundleIOSPrebuilds';

describe('parseXcodeVersion', () => {
  it('parses a normal `xcodebuild -version` output', () => {
    assert.equal(parseXcodeVersion('Xcode 26.2\nBuild version 17C52\n'), '26.2.0');
  });

  it('parses an Xcode version with a patch component', () => {
    assert.equal(parseXcodeVersion('Xcode 26.4.1\nBuild version 16A5318g\n'), '26.4.1');
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
      async () => '26.0.0',
      async () => [
        {
          developerDir: '/Applications/Xcode_26.2.app/Contents/Developer',
          xcode: SUPPORTED_XCODE_VERSION,
        },
      ]
    );
    assert.equal(process.env.DEVELOPER_DIR, '/Applications/Xcode_26.2.app/Contents/Developer');
    restore();
    assert.equal(process.env.DEVELOPER_DIR, undefined);
  });

  it('preserves a prior DEVELOPER_DIR value across switch + restore', async () => {
    const prior = '/Applications/Xcode_27.0.app/Contents/Developer';
    process.env.DEVELOPER_DIR = prior;
    const restore = await ensureSupportedToolchainAsync(
      async () => '27.0.0',
      async () => [
        {
          developerDir: '/Applications/Xcode_26.2.app/Contents/Developer',
          xcode: SUPPORTED_XCODE_VERSION,
        },
      ]
    );
    assert.equal(process.env.DEVELOPER_DIR, '/Applications/Xcode_26.2.app/Contents/Developer');
    restore();
    assert.equal(process.env.DEVELOPER_DIR, prior);
  });

  it('throws with a what/why/how message when no supported toolchain is available', async () => {
    delete process.env.DEVELOPER_DIR;
    await assert.rejects(
      ensureSupportedToolchainAsync(
        async () => '26.0.0',
        async () => []
      ),
      (err: Error) => {
        assert.match(err.message, /Active toolchain is Xcode 26\.0/);
        assert.match(err.message, /must be built with Xcode 26\.2/);
        assert.match(err.message, /No Xcode-shaped apps found in \/Applications/);
        assert.match(err.message, /developer\.apple\.com/);
        return true;
      }
    );
    assert.equal(process.env.DEVELOPER_DIR, undefined);
  });

  it('lists discovered Xcodes in the throw message when none match', async () => {
    delete process.env.DEVELOPER_DIR;
    await assert.rejects(
      ensureSupportedToolchainAsync(
        async () => '26.0.0',
        async () => [
          {
            developerDir: '/Applications/Xcode_26.0.app/Contents/Developer',
            xcode: '26.0.0',
          },
          {
            developerDir: '/Applications/Xcode_15.4.app/Contents/Developer',
            xcode: '15.4.0',
          },
        ]
      ),
      (err: Error) => {
        assert.match(err.message, /Found in \/Applications/);
        assert.match(err.message, /Xcode 26\.0 at \/Applications\/Xcode_26\.0\.app/);
        assert.match(err.message, /Xcode 15\.4 at \/Applications\/Xcode_15\.4\.app/);
        return true;
      }
    );
  });
});
