import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  normalizeHeadSha,
  normalizePullRequestRef,
  normalizeSandboxCommandRequest,
  normalizeSandboxCwd,
  normalizeSandboxPath,
  parsePublicPullRequestUrl,
  validateSandboxPreset,
} from './validation';

describe('PR sandbox validation', () => {
  it('should parse public github pull request urls', () => {
    const ref = parsePublicPullRequestUrl('https://github.com/expo/expo/pull/123?foo=bar');

    assert.deepEqual(ref, {
      owner: 'expo',
      name: 'expo',
      repo: 'expo/expo',
      pullNumber: 123,
      prUrl: 'https://github.com/expo/expo/pull/123?foo=bar',
    });
  });

  it('should reject non-github pull request urls', () => {
    assert.throws(() => parsePublicPullRequestUrl('https://example.com/expo/expo/pull/123'));
  });

  it('should normalize pull request refs from repo and pull number', () => {
    const ref = normalizePullRequestRef({
      repo: 'Expo/expo',
      pullNumber: '123',
      headSha: 'ABCDEF1234567890ABCDEF1234567890ABCDEF12',
    });

    assert.equal(ref.repo, 'Expo/expo');
    assert.equal(ref.headSha, 'abcdef1234567890abcdef1234567890abcdef12');
    assert.equal(ref.pullNumber, 123);
  });

  it('should reject invalid head shas', () => {
    assert.throws(() => normalizeHeadSha('main'));
  });

  it('should accept only allowlisted sandbox presets', () => {
    assert.equal(validateSandboxPreset('node_test'), 'node_test');
    assert.throws(() => validateSandboxPreset('npm run test'));
  });

  it('should reject sandbox paths outside the checkout', () => {
    assert.equal(
      normalizeSandboxPath('./packages/expo/package.json'),
      'packages/expo/package.json'
    );
    assert.throws(() => normalizeSandboxPath('../package.json'));
    assert.throws(() => normalizeSandboxPath('/etc/passwd'));
  });

  it('should normalize sandbox command requests', () => {
    assert.deepEqual(
      normalizeSandboxCommandRequest({
        command: ' node -e "console.log(1)" ',
        cwd: './packages/expo',
        timeout: '1000',
      }),
      {
        command: 'node -e "console.log(1)"',
        cwd: 'packages/expo',
        timeout: 1000,
      }
    );
    assert.equal(normalizeSandboxCwd('.'), '.');
  });

  it('should reject invalid sandbox command requests', () => {
    assert.throws(() => normalizeSandboxCommandRequest({ command: '' }));
    assert.throws(() =>
      normalizeSandboxCommandRequest({ command: 'pnpm lint', cwd: '../outside' })
    );
    assert.throws(() => normalizeSandboxCommandRequest({ command: 'pnpm lint', timeout: 600001 }));
  });
});
