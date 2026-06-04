import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { capSandboxLogs, redactSandboxLogs } from './logs';

describe('Sandbox log handling', () => {
  it('should redact known credential assignments', () => {
    const logs = redactSandboxLogs('OPENAI_API_KEY=sk-secret\nGITHUB_TOKEN: ghp_secret');

    assert.equal(logs, 'OPENAI_API_KEY=[redacted]\nGITHUB_TOKEN=[redacted]');
  });

  it('should truncate logs after the configured cap', () => {
    const logs = capSandboxLogs('abcdef', 3);

    assert.equal(logs, 'abc\n[truncated 3 characters]');
  });
});
