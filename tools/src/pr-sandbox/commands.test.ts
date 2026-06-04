import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createPresetCommand } from './commands';
import type { PullRequestRef } from './types';

const REF: PullRequestRef = {
  owner: 'expo',
  name: 'expo',
  repo: 'expo/expo',
  pullNumber: 123,
  headSha: 'abcdef1234567890abcdef1234567890abcdef12',
  prUrl: 'https://github.com/expo/expo/pull/123',
};

describe('Sandbox preset commands', () => {
  it('should build checkout commands pinned to the exact head sha', () => {
    const command = createPresetCommand('checkout', REF);

    assert.match(command.command, /https:\/\/github\.com\/expo\/expo\.git/);
    assert.match(command.command, /abcdef1234567890abcdef1234567890abcdef12/);
    assert.match(command.command, /git checkout --detach/);
  });

  it('should reject arbitrary command input', () => {
    assert.throws(() => createPresetCommand('npm test && printenv', REF));
  });

  it('should require metadata for checkout', () => {
    assert.throws(() => createPresetCommand('checkout'));
  });

  it('should run swift only when the sandbox image provides swift', () => {
    const command = createPresetCommand('swift_check');

    assert.match(command.command, /command -v swift/);
    assert.match(command.command, /swift test/);
  });
});
