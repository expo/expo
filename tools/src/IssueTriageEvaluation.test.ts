import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  couldCloseWhenOpened,
  humanAppliedLabels,
  IssueScore,
  summarize,
} from './IssueTriageEvaluation';

describe('couldCloseWhenOpened', () => {
  const issue = { user: { login: 'reporter' }, author_association: 'NONE' };
  const event = (actor: string, label: string) => ({
    actor,
    label,
    createdAt: '2026-09-23T09:00:01Z',
  });

  it('counts only labels that exist before the live step runs', () => {
    assert.equal(couldCloseWhenOpened(issue, []), true);
    assert.equal(couldCloseWhenOpened({ ...issue, author_association: 'MEMBER' }, []), false);
    const template = [event('reporter', 'invalid issue: question')];
    assert.equal(couldCloseWhenOpened(issue, template), false);
    const validator = [event('expo-bot', 'incomplete issue: missing or invalid repro')];
    assert.equal(couldCloseWhenOpened(issue, validator), false);
    const maintainer = [event('brentvatne', 'Issue accepted')];
    assert.equal(couldCloseWhenOpened(issue, maintainer), true);
  });
});

describe('summarize', () => {
  it('counts would-close agreement per label and keeps issues without truth apart', () => {
    const score = (
      label: string | null,
      truth: { truth: string; agrees: boolean } | null
    ): IssueScore => ({
      confidences: { triage: 0.95, package: 0.95, platform: 0.95 },
      agreement: { triage: truth, package: null, platform: null },
      wouldClose: { label, truth },
    });
    const label = 'invalid issue: question';
    const { wouldClose, closable } = summarize([
      score(label, { truth: 'question', agrees: true }),
      score(label, { truth: 'bug_report', agrees: false }),
      score(label, null),
      score(null, { truth: 'bug_report', agrees: false }),
    ]);
    assert.deepEqual(wouldClose.get(label), { n: 2, agree: 1, noTruth: 1 });
    assert.equal(wouldClose.size, 1);
    assert.equal(closable, 4);
  });
});

describe('humanAppliedLabels', () => {
  it('keeps labels a person applied and drops bot and backfill labels', () => {
    const labels = humanAppliedLabels(
      ['needs review', 'Issue accepted', '📦 expo-audio', 'iOS', 'Android'],
      [
        { actor: 'expo-bot', label: 'needs review', createdAt: '2026-09-22T15:29:34Z' },
        { actor: 'brentvatne', label: 'Issue accepted', createdAt: '2026-09-23T10:00:00Z' },
        { actor: 'vonovak', label: '📦 expo-audio', createdAt: '2026-09-22T20:28:03Z' },
        { actor: 'vonovak', label: 'iOS', createdAt: '2026-09-22T20:28:03Z' },
        { actor: 'vonovak', label: 'Android', createdAt: '2026-09-23T09:00:00Z' },
        { actor: 'someone', label: 'removed later', createdAt: '2026-09-23T09:00:00Z' },
      ],
      'reporter'
    );
    assert.deepEqual(labels, ['Issue accepted', 'Android']);
  });

  it('drops labels the issue template applied as the author', () => {
    const labels = humanAppliedLabels(
      ['invalid issue: feature request', 'iOS'],
      [
        {
          actor: 'reporter',
          label: 'invalid issue: feature request',
          createdAt: '2026-09-23T09:00:01Z',
        },
        { actor: 'reporter', label: 'iOS', createdAt: '2026-09-23T09:00:01Z' },
      ],
      'reporter'
    );
    assert.deepEqual(labels, ['iOS']);
  });
});
