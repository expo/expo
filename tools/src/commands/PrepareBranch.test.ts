import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validatePreconditions } from './PrepareBranchCommand';

describe('validatePreconditions', () => {
  it('passes on a clean tree on an sdk branch', () => {
    const result = validatePreconditions({ branchName: 'sdk-56', dirtyFiles: [], force: false });
    assert.equal(result.warning, null);
    assert.equal(result.error, null);
  });

  it('errors when the tree is dirty and force is off', () => {
    const result = validatePreconditions({
      branchName: 'sdk-56',
      dirtyFiles: [' M pnpm-lock.yaml'],
      force: false,
    });
    assert.match(result.error ?? '', /pnpm-lock\.yaml/);
  });

  it('does not error when the tree is dirty and force is on', () => {
    const result = validatePreconditions({
      branchName: 'sdk-56',
      dirtyFiles: [' M pnpm-lock.yaml'],
      force: true,
    });
    assert.equal(result.error, null);
  });

  it('warns on a non-sdk branch without erroring', () => {
    const result = validatePreconditions({ branchName: 'main', dirtyFiles: [], force: false });
    assert.match(result.warning ?? '', /main/);
    assert.equal(result.error, null);
  });
});
