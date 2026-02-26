/**
 * Tests for Reporter — logPackageBanner smoke tests.
 *
 * logPackageBanner writes to logger.info (stdout), so we verify it
 * doesn't throw with valid inputs. More detailed output testing would
 * require mocking the logger.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { SPMPackageSource } from '../ExternalPackage';
import type { BuildFlavor } from '../Prebuilder.types';

import { logPackageBanner } from './Reporter';

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
      logPackageBanner(stubPkg(), 0, 5, ['Debug'] as BuildFlavor[], '/repo/packages/precompile/.cache');
    });
  });

  it('does not throw with multiple flavors', () => {
    assert.doesNotThrow(() => {
      logPackageBanner(stubPkg(), 2, 10, ['Debug', 'Release'] as BuildFlavor[], '/repo/packages/precompile/.cache');
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
      logPackageBanner(stubPkg(), 4, 5, ['Debug'] as BuildFlavor[], '/repo/packages/precompile/.cache');
    });
  });
});
