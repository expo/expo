/**
 * Tests for Utils — isNonInteractive / setForceNonInteractive.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { before, describe, it, afterEach } from 'node:test';

import {
  getVersionsInfoAsync,
  isNonInteractive,
  selectDistributedPackages,
  setForceNonInteractive,
  IOS_PREBUILD_PACKAGES,
} from './Utils';
import { resolvePackagePath } from './resolvePackage';

// ---------------------------------------------------------------------------
// isNonInteractive / setForceNonInteractive
// ---------------------------------------------------------------------------

describe('isNonInteractive', () => {
  // Save and restore CI env var around each test
  const originalCI = process.env.CI;

  afterEach(() => {
    setForceNonInteractive(false);
    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    } else {
      delete process.env.CI;
    }
  });

  it('returns false by default (when CI not set, force not set)', () => {
    delete process.env.CI;
    setForceNonInteractive(false);
    // Note: process.stdout.isTTY may be undefined in test runner (non-TTY),
    // which would make this return true. We only assert the force path here.
    // If running in a non-TTY environment, this test is skipped implicitly.
    if (process.stdout.isTTY !== false) {
      assert.equal(isNonInteractive(), false);
    }
  });

  it('returns true when setForceNonInteractive(true) is called', () => {
    delete process.env.CI;
    setForceNonInteractive(true);
    assert.equal(isNonInteractive(), true);
  });

  it('returns false after setForceNonInteractive(false) resets', () => {
    setForceNonInteractive(true);
    assert.equal(isNonInteractive(), true);
    setForceNonInteractive(false);
    if (process.stdout.isTTY !== false && process.env.CI == null) {
      assert.equal(isNonInteractive(), false);
    }
  });

  it('returns true when process.env.CI is set', () => {
    process.env.CI = '1';
    setForceNonInteractive(false);
    assert.equal(isNonInteractive(), true);
  });

  it('returns true when process.env.CI is empty string', () => {
    // CI != null is true even for empty string
    process.env.CI = '';
    setForceNonInteractive(false);
    assert.equal(isNonInteractive(), true);
  });
});

describe('selectDistributedPackages', () => {
  const fakePackages = [
    { packageName: 'expo-modules-core' },
    { packageName: 'expo-video' },
    { packageName: 'expo-age-range' },
    { packageName: 'expo-blur' },
  ] as any[];

  it('keeps only the distributed set when allPackages is false', () => {
    const result = selectDistributedPackages(fakePackages, false);
    assert.deepEqual(
      result.map((p) => p.packageName),
      ['expo-modules-core', 'expo-video']
    );
  });

  it('returns every package unchanged when allPackages is true', () => {
    const result = selectDistributedPackages(fakePackages, true);
    assert.equal(result, fakePackages);
  });

  it('IOS_PREBUILD_PACKAGES lists the 15 distributed packages', () => {
    assert.equal(IOS_PREBUILD_PACKAGES.length, 15);
    assert.ok(IOS_PREBUILD_PACKAGES.includes('expo-modules-core'));
    assert.ok(!IOS_PREBUILD_PACKAGES.includes('expo-age-range'));
  });
});

// ---------------------------------------------------------------------------
// getVersionsInfoAsync — Hermes V1 polarity vs hermes-engine.podspec
// ---------------------------------------------------------------------------
//
// React Native's hermes-engine.podspec defaults to Hermes V1 and opts out
// only when RCT_HERMES_V1_ENABLED == "0":
//
//   if ENV['RCT_HERMES_V1_ENABLED'] == "0"
//     version = versionProperties['HERMES_VERSION_NAME']      # classic
//   else
//     version = versionProperties['HERMES_V1_VERSION_NAME']    # default = V1
//
// getVersionsInfoAsync must use the same polarity, otherwise the precompile
// pipeline downloads classic Hermes headers (HERMES_VERSION_NAME) while the
// consuming app links V1 Hermes (HERMES_V1_VERSION_NAME) → release crashes
// from struct-layout drift.

describe('getVersionsInfoAsync — Hermes V1 polarity', () => {
  let classicVersion;
  let v1Version;
  let propertiesAvailable = false;

  before(() => {
    const rnPath = resolvePackagePath('react-native');
    const propsPath = path.join(rnPath, 'sdks', 'hermes-engine', 'version.properties');
    if (!fs.existsSync(propsPath)) return;
    const content = fs.readFileSync(propsPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, value] = trimmed.split('=');
      if (key === 'HERMES_VERSION_NAME') classicVersion = value?.trim();
      if (key === 'HERMES_V1_VERSION_NAME') v1Version = value?.trim();
    }
    propertiesAvailable = !!classicVersion && !!v1Version && classicVersion !== v1Version;
  });

  const originalEnv = process.env.RCT_HERMES_V1_ENABLED;
  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.RCT_HERMES_V1_ENABLED;
    } else {
      process.env.RCT_HERMES_V1_ENABLED = originalEnv;
    }
  });

  it('defaults to HERMES_V1_VERSION_NAME when RCT_HERMES_V1_ENABLED is unset', async (t) => {
    if (!propertiesAvailable) {
      t.skip('version.properties does not expose distinct classic/V1 keys');
      return;
    }
    delete process.env.RCT_HERMES_V1_ENABLED;
    const { hermesVersion } = await getVersionsInfoAsync({});
    assert.equal(hermesVersion, v1Version);
    assert.notEqual(hermesVersion, classicVersion);
  });

  it('returns HERMES_V1_VERSION_NAME when RCT_HERMES_V1_ENABLED === "1"', async (t) => {
    if (!propertiesAvailable) {
      t.skip('version.properties does not expose distinct classic/V1 keys');
      return;
    }
    process.env.RCT_HERMES_V1_ENABLED = '1';
    const { hermesVersion } = await getVersionsInfoAsync({});
    assert.equal(hermesVersion, v1Version);
  });

  it('returns HERMES_VERSION_NAME (classic) only when RCT_HERMES_V1_ENABLED === "0"', async (t) => {
    if (!propertiesAvailable) {
      t.skip('version.properties does not expose distinct classic/V1 keys');
      return;
    }
    process.env.RCT_HERMES_V1_ENABLED = '0';
    const { hermesVersion } = await getVersionsInfoAsync({});
    assert.equal(hermesVersion, classicVersion);
  });

  // React Native 0.87+ collapsed the dual engines back to a single HERMES_VERSION_NAME.
  // With V1 enabled by default, resolution must fall back to HERMES_VERSION_NAME instead
  // of throwing because the (now absent) HERMES_V1_VERSION_NAME key can't be read.
  it('falls back to HERMES_VERSION_NAME when there is no V1 key (single-engine RN)', async (t) => {
    if (!(classicVersion && !v1Version)) {
      t.skip('version.properties exposes a V1 key; single-engine fallback not applicable');
      return;
    }
    delete process.env.RCT_HERMES_V1_ENABLED;
    const { hermesVersion } = await getVersionsInfoAsync({});
    assert.equal(hermesVersion, classicVersion);
  });
});
