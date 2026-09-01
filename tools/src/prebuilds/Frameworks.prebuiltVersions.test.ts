/**
 * Tests for the versions record written next to the prebuilt tarballs, which is what
 * lets `pod install` tell whether an xcframework was compiled against the React Native
 * the app actually has installed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { Frameworks, PREBUILT_VERSIONS_FILENAME } from './Frameworks';
import { VersionStamp } from './VersionStamp';

describe('Frameworks.writePrebuiltVersions', () => {
  let outputDir: string;

  beforeEach(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuilt-versions-test-'));
  });

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  it('records both versions in the output directory', () => {
    Frameworks.writePrebuiltVersions(outputDir, {
      reactNativeVersion: '0.86.2',
      hermesVersion: '250829098.0.16',
    });

    assert.deepEqual(VersionStamp.read(outputDir, PREBUILT_VERSIONS_FILENAME), {
      reactNativeVersion: '0.86.2',
      hermesVersion: '250829098.0.16',
    });
  });

  // An empty value would read as a mismatch on every consumer and push every module to
  // a source build, so a half-known pair must leave no record at all.
  it('writes nothing when the React Native version is unknown', () => {
    Frameworks.writePrebuiltVersions(outputDir, {
      reactNativeVersion: '',
      hermesVersion: '250829098.0.16',
    });

    assert.equal(VersionStamp.read(outputDir, PREBUILT_VERSIONS_FILENAME), null);
  });

  it('writes nothing when the Hermes version is unknown', () => {
    Frameworks.writePrebuiltVersions(outputDir, {
      reactNativeVersion: '0.86.2',
      hermesVersion: '',
    });

    assert.equal(VersionStamp.read(outputDir, PREBUILT_VERSIONS_FILENAME), null);
  });

  it('writes nothing when no versions are given', () => {
    Frameworks.writePrebuiltVersions(outputDir, undefined);

    assert.equal(VersionStamp.read(outputDir, PREBUILT_VERSIONS_FILENAME), null);
  });
});
