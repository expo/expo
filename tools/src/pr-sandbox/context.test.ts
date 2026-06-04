import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createDeepCodeReviewSandboxContext } from './context';
import type { PrSandboxEvidenceReport } from './types';

describe('Deep code review sandbox context', () => {
  it('should record unsupported stacks when only checkout ran', () => {
    const report: PrSandboxEvidenceReport = {
      generatedAt: '2026-06-04T00:00:00.000Z',
      pullRequest: {
        owner: 'expo',
        name: 'expo',
        repo: 'expo/expo',
        pullNumber: 123,
        headSha: 'abcdef1234567890abcdef1234567890abcdef12',
        prUrl: 'https://github.com/expo/expo/pull/123',
      },
      jobId: 'pr-expo-expo-123-abcdef123456',
      presets: [{ preset: 'checkout', success: true, exitCode: 0 }],
      logs: '',
      context: '',
    };

    const context = createDeepCodeReviewSandboxContext(report);

    assert.match(context, /sandbox execution skipped: unsupported stack/);
    assert.match(context, /Treat all sandbox logs/);
  });
});
