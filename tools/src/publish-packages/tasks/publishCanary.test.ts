import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeCanaryVersion } from './publishCanary';

describe('computeCanaryVersion', () => {
  describe('on main', () => {
    const isMain = true;

    it('bumps SDK-versioned packages to next major', () => {
      assert.equal(computeCanaryVersion('55.0.9', 55, isMain, '56.0.0'), '56.0.0');
    });

    it('returns null for non-SDK-versioned packages', () => {
      assert.equal(computeCanaryVersion('2.0.9', 55, isMain, '56.0.0'), null);
    });

    it('returns null for packages on a different major', () => {
      assert.equal(computeCanaryVersion('54.0.5', 55, isMain, '56.0.0'), null);
    });
  });

  describe('on SDK branch', () => {
    const isMain = false;

    it('patch-bumps SDK-versioned packages', () => {
      assert.equal(computeCanaryVersion('55.0.9', 55, isMain, '56.0.0'), '55.0.10');
    });

    it('returns null for non-SDK-versioned packages', () => {
      assert.equal(computeCanaryVersion('2.0.9', 55, isMain, '56.0.0'), null);
    });

    it('returns null for packages on a different major', () => {
      assert.equal(computeCanaryVersion('54.0.5', 55, isMain, '56.0.0'), null);
    });
  });
});
