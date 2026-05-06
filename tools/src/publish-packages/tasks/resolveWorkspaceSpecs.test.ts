import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveWorkspaceSpec } from './resolveWorkspaceSpecs';

const ctx = { packageName: 'consumer', depKey: 'dependencies', depName: 'target' };

describe('resolveWorkspaceSpec', () => {
  it('returns target version for workspace:*', () => {
    assert.equal(resolveWorkspaceSpec('workspace:*', '1.2.3', ctx), '1.2.3');
  });

  it('returns target version for bare workspace: with no suffix', () => {
    assert.equal(resolveWorkspaceSpec('workspace:', '1.2.3', ctx), '1.2.3');
  });

  it('prepends ^ to target version for workspace:^', () => {
    assert.equal(resolveWorkspaceSpec('workspace:^', '1.2.3', ctx), '^1.2.3');
  });

  it('prepends ~ to target version for workspace:~', () => {
    assert.equal(resolveWorkspaceSpec('workspace:~', '1.2.3', ctx), '~1.2.3');
  });

  it('strips workspace: prefix for explicit version', () => {
    assert.equal(resolveWorkspaceSpec('workspace:1.2.3', undefined, ctx), '1.2.3');
  });

  it('strips workspace: prefix for explicit caret range', () => {
    assert.equal(resolveWorkspaceSpec('workspace:^1.2.3', undefined, ctx), '^1.2.3');
  });

  it('strips workspace: prefix for explicit tilde range', () => {
    assert.equal(resolveWorkspaceSpec('workspace:~1.2.3', undefined, ctx), '~1.2.3');
  });

  it('returns non-workspace specs unchanged', () => {
    assert.equal(resolveWorkspaceSpec('^1.2.3', '9.9.9', ctx), '^1.2.3');
    assert.equal(resolveWorkspaceSpec('1.2.3', undefined, ctx), '1.2.3');
    assert.equal(resolveWorkspaceSpec('*', undefined, ctx), '*');
  });

  it('passes through prerelease versions when target is prerelease', () => {
    assert.equal(resolveWorkspaceSpec('workspace:*', '56.0.0-preview.1', ctx), '56.0.0-preview.1');
    assert.equal(resolveWorkspaceSpec('workspace:^', '56.0.0-preview.1', ctx), '^56.0.0-preview.1');
  });

  describe('error handling', () => {
    it('throws when target version is missing for workspace:*', () => {
      assert.throws(
        () => resolveWorkspaceSpec('workspace:*', undefined, ctx),
        /not a workspace package/
      );
    });

    it('throws when target version is missing for workspace:^', () => {
      assert.throws(
        () => resolveWorkspaceSpec('workspace:^', undefined, ctx),
        /not a workspace package/
      );
    });

    it('throws when target version is missing for workspace:~', () => {
      assert.throws(
        () => resolveWorkspaceSpec('workspace:~', undefined, ctx),
        /not a workspace package/
      );
    });

    it('throws when target version is missing for bare workspace:', () => {
      assert.throws(
        () => resolveWorkspaceSpec('workspace:', undefined, ctx),
        /not a workspace package/
      );
    });

    it('does not require target version for explicit-version specs', () => {
      // Explicit forms ship the embedded version regardless of workspace state.
      assert.doesNotThrow(() => resolveWorkspaceSpec('workspace:1.2.3', undefined, ctx));
      assert.doesNotThrow(() => resolveWorkspaceSpec('workspace:^1.2.3', undefined, ctx));
    });

    it('error message names the offending package and dep', () => {
      assert.throws(
        () =>
          resolveWorkspaceSpec('workspace:*', undefined, {
            packageName: '@expo/cli',
            depKey: 'dependencies',
            depName: '@expo/inline-modules',
          }),
        (err: Error) => {
          assert.match(err.message, /@expo\/cli/);
          assert.match(err.message, /dependencies\.@expo\/inline-modules/);
          assert.match(err.message, /workspace:\*/);
          return true;
        }
      );
    });
  });
});
