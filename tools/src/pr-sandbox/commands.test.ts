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
    assert.match(command.command, /refs\/pull\/123\/head/);
    assert.match(command.command, /--no-tags/);
    assert.match(command.command, /--filter=blob:none/);
    assert.match(command.command, /protocol\.version=2/);
    assert.doesNotMatch(command.command, /repo\.tar\.gz/);
    assert.doesNotMatch(command.command, /codeload\.github\.com/);
    assert.match(command.command, /git init -q/);
    assert.match(command.command, /git config gc\.auto 0/);
    assert.match(command.command, /git config maintenance\.auto false/);
    assert.match(command.command, /git config fetch\.writeCommitGraph false/);
    assert.match(command.command, /git checkout --detach --force FETCH_HEAD/);
    assert.match(command.command, /head-sha\.txt/);
    assert.equal(command.timeout, 600_000);
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
