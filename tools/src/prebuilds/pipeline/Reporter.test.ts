/**
 * Tests for Reporter — logPackageBanner smoke tests.
 *
 * logPackageBanner writes to logger.info (stdout), so we verify it
 * doesn't throw with valid inputs. More detailed output testing would
 * require mocking the logger.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SPMPackageSource } from '../ExternalPackage';
import type { BuildFlavor } from '../Prebuilder.types';
import { computeSummaryCounts, logPackageBanner } from './Reporter';
import type { UnitStatus } from './Types';

// ---------------------------------------------------------------------------
// Stub helpers
// ---------------------------------------------------------------------------

function stubPkg(overrides: Partial<SPMPackageSource> = {}): SPMPackageSource {
  return {
    path: '/repo/packages/expo-foo',
    buildPath: '/repo/packages/precompile/.build/expo-foo',
    packageName: 'expo-foo',
    packageVersion: '1.0.0',
    getSwiftPMConfiguration: () => ({ products: [] }),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// logPackageBanner
// ---------------------------------------------------------------------------

describe('logPackageBanner', () => {
  it('does not throw with a single flavor', () => {
    assert.doesNotThrow(() => {
      logPackageBanner(
        stubPkg(),
        0,
        5,
        ['Debug'] as BuildFlavor[],
        '/repo/packages/precompile/.cache'
      );
    });
  });

  it('does not throw with multiple flavors', () => {
    assert.doesNotThrow(() => {
      logPackageBanner(
        stubPkg(),
        2,
        10,
        ['Debug', 'Release'] as BuildFlavor[],
        '/repo/packages/precompile/.cache'
      );
    });
  });

  it('does not throw with custom package name', () => {
    assert.doesNotThrow(() => {
      logPackageBanner(
        stubPkg({ packageName: '@expo/ui' }),
        0,
        1,
        ['Release'] as BuildFlavor[],
        '/tmp/artifacts'
      );
    });
  });

  it('does not throw at boundary index (last package)', () => {
    assert.doesNotThrow(() => {
      logPackageBanner(
        stubPkg(),
        4,
        5,
        ['Debug'] as BuildFlavor[],
        '/repo/packages/precompile/.cache'
      );
    });
  });
});

// ---------------------------------------------------------------------------
// computeSummaryCounts
// ---------------------------------------------------------------------------

function makeUnit(overrides: Partial<UnitStatus> = {}): UnitStatus {
  return {
    packageName: 'pkg',
    productName: 'prod',
    flavor: 'Release',
    unitId: 'pkg/prod[Release]',
    stages: {
      generate: 'success',
      build: 'success',
      compose: 'success',
      verify: 'success',
    },
    elapsedMs: 0,
    ...overrides,
  };
}

describe('computeSummaryCounts', () => {
  it('counts a fully successful unit as successful', () => {
    const counts = computeSummaryCounts([makeUnit()]);
    assert.equal(counts.successful, 1);
    assert.equal(counts.failed, 0);
  });

  it('counts a unit with a failed stage as failed', () => {
    const counts = computeSummaryCounts([
      makeUnit({
        stages: { generate: 'failed', build: 'skipped', compose: 'skipped', verify: 'skipped' },
      }),
    ]);
    assert.equal(counts.successful, 0);
    assert.equal(counts.failed, 1);
  });

  it('counts a unit with a verify warning as successful-with-warning', () => {
    const counts = computeSummaryCounts([
      makeUnit({
        stages: { generate: 'success', build: 'success', compose: 'success', verify: 'warning' },
      }),
    ]);
    assert.equal(counts.successful, 1);
    assert.equal(counts.warnings, 1);
    assert.equal(counts.failed, 0);
  });

  it('counts a unit with skipReason as failed even when all stages are skipped', () => {
    // This is the core behavior for "skipped due to upstream failure": every
    // stage is `'skipped'` (which normally counts as success), but the presence
    // of skipReason flips the unit into the failed bucket so counts + exit
    // code remain accurate.
    const counts = computeSummaryCounts([
      makeUnit({
        stages: { generate: 'skipped', build: 'skipped', compose: 'skipped', verify: 'skipped' },
        skipReason: 'dependency foo failed',
      }),
    ]);
    assert.equal(counts.successful, 0);
    assert.equal(counts.failed, 1);
  });
});
