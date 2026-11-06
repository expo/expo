import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BotBackport,
  findBackportCommit,
  findManualBackport,
  parseCommitSummaries,
  selectBotBackports,
} from './Decisions';

describe('parseCommitSummaries', () => {
  it('splits each line into the SHA and the subject', () => {
    assert.deepEqual(parseCommitSummaries('aaa fix: x (#41)\nbbb  chore: y  \n'), [
      { sha: 'aaa', subject: 'fix: x (#41)' },
      { sha: 'bbb', subject: 'chore: y' },
    ]);
  });

  it('reads no commits from empty output', () => {
    assert.deepEqual(parseCommitSummaries(''), []);
  });
});

describe('findBackportCommit', () => {
  const commits = [
    { sha: 'a41', subject: 'fix: x (#41)' },
    { sha: 'a44', subject: '[sdk-93] Title of #44 (#44) (#53100)' },
    { sha: 'a999', subject: 'chore: y (#999) (#42)' },
    { sha: 'a60', subject: '[sdk-95] Revert "Fix X #52000" (#60) (#999)' },
  ];

  it('finds the commit whose subject names the pull request first', () => {
    assert.equal(findBackportCommit(commits, '41')?.sha, 'a41');
    assert.equal(findBackportCommit(commits, '44')?.sha, 'a44');
    assert.equal(findBackportCommit(commits, '60')?.sha, 'a60');
  });

  it('ignores a pull request that a subject names only after another one', () => {
    assert.equal(findBackportCommit(commits, '42'), undefined);
    assert.equal(findBackportCommit(commits, '53100'), undefined);
    assert.equal(findBackportCommit(commits, '52000'), undefined);
  });

  it('compares the numbers as text', () => {
    assert.equal(findBackportCommit([{ sha: 'a', subject: 'x (#041)' }], '41'), undefined);
  });
});

describe('selectBotBackports', () => {
  const sameRepo = { headRepository: { name: 'expo' }, headRepositoryOwner: { login: 'expo' } };
  const fork = { headRepository: { name: 'expo' }, headRepositoryOwner: { login: 'evil' } };
  const pr = (url: string, state: string, head = sameRepo): BotBackport => ({
    url,
    state,
    ...head,
  });

  it('finds the merged, the open, and the closed backport from the repository', () => {
    assert.deepEqual(
      selectBotBackports(
        [pr('u/1', 'CLOSED'), pr('u/2', 'OPEN'), pr('u/3', 'MERGED'), pr('u/4', 'OPEN')],
        'expo/expo'
      ),
      { merged: 'u/3', open: 'u/2', closed: 'u/1' }
    );
  });

  it('ignores a pull request from a fork with the same branch name', () => {
    assert.deepEqual(
      selectBotBackports([pr('u/1', 'OPEN', fork), pr('u/2', 'MERGED', fork)], 'expo/expo'),
      {}
    );
  });

  it('ignores a head repository that is gone', () => {
    const gone: BotBackport = {
      url: 'u/1',
      state: 'CLOSED',
      headRepository: null,
      headRepositoryOwner: null,
    };
    assert.deepEqual(selectBotBackports([gone], 'expo/expo'), {});
  });
});

describe('findManualBackport', () => {
  it('finds an open pull request whose title names the pull request as (#N)', () => {
    assert.equal(
      findManualBackport(
        [{ number: 52300, title: '[store-review][sdk-90] Title of #3 (#3)' }],
        '3'
      ),
      52300
    );
  });

  it('ignores (#30), (#4), and #3 without parentheses', () => {
    assert.equal(
      findManualBackport(
        [
          { number: 1, title: '[sdk-90] X (#30)' },
          { number: 2, title: '[sdk-90] Y (#4)' },
          { number: 5, title: '[sdk-90] Fix #3' },
        ],
        '3'
      ),
      undefined
    );
  });
});
