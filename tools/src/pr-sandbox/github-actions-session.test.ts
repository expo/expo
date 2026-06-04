import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildGitHubSandboxComment,
  normalizeGitHubSandboxCommandRequest,
  normalizeGitHubSandboxNetwork,
  parseGitHubSandboxComment,
  parseGitHubSandboxComments,
} from './github-actions-session';

describe('GitHub Actions sandbox session', () => {
  it('should build and parse command comments', () => {
    const payload = {
      sessionId: 'gha-pr-expo-expo-44135-101071d59a0c-abcd1234',
      commandId: 'command-1',
      command: 'node -e "console.log(1)"',
      cwd: '.',
      timeout: 300000,
      network: 'none',
      image: 'node:22-bookworm',
      createdAt: '2026-06-05T00:00:00.000Z',
    };
    const body = buildGitHubSandboxComment(
      'command',
      payload.sessionId,
      payload,
      payload.commandId
    );

    const entry = parseGitHubSandboxComment({
      id: 1,
      body,
      created_at: '2026-06-05T00:00:01.000Z',
      user: { login: 'kudo' } as any,
    });

    assert.equal(entry?.kind, 'command');
    assert.equal(entry?.sessionId, payload.sessionId);
    assert.equal(entry?.commandId, payload.commandId);
    assert.deepEqual(entry?.payload, payload);
    assert.equal(entry?.authorLogin, 'kudo');
  });

  it('should filter comments to the requested session', () => {
    const wanted = buildGitHubSandboxComment('destroy', 'session-a', {
      sessionId: 'session-a',
      requestedAt: '2026-06-05T00:00:00.000Z',
    });
    const ignored = buildGitHubSandboxComment('destroy', 'session-b', {
      sessionId: 'session-b',
      requestedAt: '2026-06-05T00:00:00.000Z',
    });

    const entries = parseGitHubSandboxComments(
      [
        {
          id: 2,
          body: ignored,
          created_at: '2026-06-05T00:00:02.000Z',
          user: { login: 'other' } as any,
        },
        {
          id: 1,
          body: wanted,
          created_at: '2026-06-05T00:00:01.000Z',
          user: { login: 'kudo' } as any,
        },
      ],
      'session-a'
    );

    assert.equal(entries.length, 1);
    assert.equal(entries[0].sessionId, 'session-a');
    assert.equal(entries[0].commentId, 1);
  });

  it('should normalize command requests for docker execution', () => {
    assert.deepEqual(
      normalizeGitHubSandboxCommandRequest({
        command: ' pnpm lint ',
        cwd: './packages/expo',
        timeout: '1800000',
        network: 'default',
      }),
      {
        command: 'pnpm lint',
        cwd: 'packages/expo',
        timeout: 1800000,
        network: 'bridge',
        image: 'node:22-bookworm',
      }
    );
    assert.equal(normalizeGitHubSandboxNetwork(undefined), 'none');
  });

  it('should reject invalid command requests', () => {
    assert.throws(() => normalizeGitHubSandboxCommandRequest({ command: '' }));
    assert.throws(() =>
      normalizeGitHubSandboxCommandRequest({ command: 'node -v', cwd: '../outside' })
    );
    assert.throws(() =>
      normalizeGitHubSandboxCommandRequest({ command: 'node -v', timeout: 3600001 })
    );
    assert.throws(() =>
      normalizeGitHubSandboxCommandRequest({ command: 'node -v', image: 'node latest' })
    );
  });
});
