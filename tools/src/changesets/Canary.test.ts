import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getCanaryBumpType } from './Canary';

describe('getCanaryBumpType', () => {
  it('advances SDK-versioned packages to the next major from main', () => {
    assert.equal(getCanaryBumpType('58.0.1', 58, 'main'), 'major');
    assert.equal(getCanaryBumpType('58.0.0-preview.1', 58, 'main'), 'major');
  });

  it('patches independent packages and every package on an SDK release branch', () => {
    assert.equal(getCanaryBumpType('12.4.0', 58, 'main'), 'patch');
    assert.equal(getCanaryBumpType('58.0.1', 58, 'sdk-58'), 'patch');
  });
});
