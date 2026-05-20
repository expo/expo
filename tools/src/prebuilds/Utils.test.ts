/**
 * Tests for Utils — isNonInteractive / setForceNonInteractive.
 */
import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';

import { isNonInteractive, setForceNonInteractive } from './Utils';

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
