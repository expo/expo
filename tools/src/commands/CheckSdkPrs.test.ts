import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getLabelAuthor, renderRows } from './CheckSdkPrsCommand';

describe('getLabelAuthor', () => {
  it('returns the actor of a matching labeled event', () => {
    const events = [
      {
        event: 'labeled',
        actor: { login: 'brentvatne' },
        label: { name: 'sdk-55' },
        created_at: '2026-06-01T00:00:00Z',
      },
    ];
    assert.equal(getLabelAuthor(events, 'sdk-55'), 'brentvatne');
  });

  it('ignores labeled events for other labels', () => {
    const events = [
      {
        event: 'labeled',
        actor: { login: 'someone' },
        label: { name: 'bug' },
        created_at: '2026-06-01T00:00:00Z',
      },
    ];
    assert.equal(getLabelAuthor(events, 'sdk-55'), null);
  });

  it('ignores non-label timeline events', () => {
    const events = [
      { event: 'commented', actor: { login: 'someone' }, created_at: '2026-06-01T00:00:00Z' },
    ];
    assert.equal(getLabelAuthor(events, 'sdk-55'), null);
  });

  it('returns the most recent actor when the label was applied more than once', () => {
    const events = [
      {
        event: 'labeled',
        actor: { login: 'first' },
        label: { name: 'sdk-55' },
        created_at: '2026-06-01T00:00:00Z',
      },
      {
        event: 'unlabeled',
        actor: { login: 'first' },
        label: { name: 'sdk-55' },
        created_at: '2026-06-02T00:00:00Z',
      },
      {
        event: 'labeled',
        actor: { login: 'second' },
        label: { name: 'sdk-55' },
        created_at: '2026-06-03T00:00:00Z',
      },
    ];
    assert.equal(getLabelAuthor(events, 'sdk-55'), 'second');
  });

  it('returns null when there are no events', () => {
    assert.equal(getLabelAuthor([], 'sdk-55'), null);
  });

  it('tolerates a missing actor', () => {
    const events = [
      {
        event: 'labeled',
        actor: null,
        label: { name: 'sdk-55' },
        created_at: '2026-06-01T00:00:00Z',
      },
    ];
    assert.equal(getLabelAuthor(events, 'sdk-55'), null);
  });
});

describe('renderRows', () => {
  it('drops columns that are empty in every row and pads to the widest cell', () => {
    const rows = [
      ['#1', '', 'a', 'today'],
      ['#22', '', 'bb', '1d'],
    ];
    assert.deepEqual(renderRows(rows), ['  #1   a   today', '  #22  bb  1d']);
  });

  it('keeps a column that is populated in only some rows', () => {
    const rows = [
      ['#1', 'published', 'title'],
      ['#2', '', 'other'],
    ];
    assert.deepEqual(renderRows(rows), ['  #1  published  title', '  #2             other']);
  });
});
