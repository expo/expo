import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { PrSandboxClient } from './client';

const originalFetch = globalThis.fetch;

describe('PR sandbox client', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should include request url and cause when fetch fails', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed', { cause: new Error('ENOTFOUND worker') });
    };

    const client = new PrSandboxClient({
      workerUrl: 'https://pr-sandbox-review.example.workers.dev',
    });

    await assert.rejects(() => client.getLogsAsync('job-123'), {
      message:
        /https:\/\/pr-sandbox-review\.example\.workers\.dev\/jobs\/job-123\/logs.*ENOTFOUND worker/,
    });
  });

  it('should surface non-json error responses', async () => {
    globalThis.fetch = async () =>
      new Response('<html>not found</html>', {
        status: 404,
        headers: { 'content-type': 'text/html' },
      });

    const client = new PrSandboxClient({
      workerUrl: 'https://pr-sandbox-review.example.workers.dev',
    });

    await assert.rejects(() => client.getLogsAsync('job-123'), {
      message: /<html>not found<\/html>/,
    });
  });

  it('should poll async sandbox tasks until completion', async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      if (requests.length === 1) {
        return Response.json({
          taskId: 'task-123',
          status: 'running',
          startedAt: '2026-06-04T00:00:00.000Z',
          timeout: 300_000,
        });
      }
      return Response.json({
        taskId: 'task-123',
        status: 'completed',
        startedAt: '2026-06-04T00:00:00.000Z',
        finishedAt: '2026-06-04T00:00:01.000Z',
        timeout: 300_000,
        result: {
          preset: 'checkout',
          success: true,
          exitCode: 0,
          stdout: 'ok',
          stderr: '',
        },
      });
    };

    const client = new PrSandboxClient({
      workerUrl: 'https://pr-sandbox-review.example.workers.dev',
      pollIntervalMs: 0,
    });

    const result = await client.runPresetAsync('job-123', 'checkout');

    assert.equal(result.success, true);
    assert.equal(result.stdout, 'ok');
    assert.deepEqual(requests, [
      'https://pr-sandbox-review.example.workers.dev/jobs/job-123/presets/checkout?async=1',
      'https://pr-sandbox-review.example.workers.dev/jobs/job-123/tasks/task-123',
    ]);
  });
});
