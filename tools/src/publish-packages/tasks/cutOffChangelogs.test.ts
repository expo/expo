import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getCutOffSkipReason } from './cutOffChangelogs';

describe('getCutOffSkipReason', () => {
  it('cuts off a stable version', () => {
    assert.equal(getCutOffSkipReason('58.0.0', true, ['57.0.9']), null);
  });

  it('skips a prerelease version', () => {
    assert.equal(getCutOffSkipReason('58.0.0-preview.0', true, ['57.0.9']), 'prerelease version');
  });

  it('skips a canary version', () => {
    assert.equal(
      getCutOffSkipReason('58.0.0-canary-20260909-ea7a89a', true, ['57.0.9']),
      'prerelease version'
    );
  });

  it('skips a package without a changelog', () => {
    assert.equal(getCutOffSkipReason('58.0.0', false, []), 'no changelog file');
  });

  it('skips a version that has already been cut off', () => {
    assert.equal(
      getCutOffSkipReason('58.0.0', true, ['58.0.0', '57.0.9']),
      'version already exists'
    );
  });
});
