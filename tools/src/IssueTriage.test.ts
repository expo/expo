import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  agreements,
  Blocker,
  buildQuestions,
  closeBlocker,
  couldCloseWhenOpened,
  countWouldClose,
  decideLabels,
  formatReport,
  gateConfidences,
  humanAppliedLabels,
  IssueClassification,
  LabelDecision,
  labelsWithStatus,
  MISSING_REPRO_LABEL,
  packageOptionsFromLabels,
  parseAnswers,
  QuestionId,
  QUESTION_IDS,
} from './IssueTriage';

type Choices = {
  [K in QuestionId]?: [IssueClassification[K]['choice'], number, Record<string, number>?];
};

const QUESTIONS = buildQuestions(['expo-audio', 'expo-video', 'none']);

function answer(
  name: string,
  choice: string,
  confidence = 0.99,
  probabilities = { [choice]: confidence }
) {
  return {
    type: 'choice' as const,
    name,
    choice,
    confidence,
    probabilities: Object.entries(probabilities).map(([value, probability]) => ({
      value,
      probability,
    })),
  };
}

function classification(overrides: Choices = {}): IssueClassification {
  const choices: Record<QuestionId, [string, number, Record<string, number>?]> = {
    triage: ['bug_report', 0.99],
    package: ['none', 0.99],
    platform: ['multiple_or_unclear', 0.99],
    ...overrides,
  };
  return parseAnswers(
    QUESTION_IDS.map((id) => {
      const [choice, confidence, probabilities] = choices[id];
      return answer(id, choice, confidence, probabilities);
    }),
    QUESTIONS
  );
}

describe('packageOptionsFromLabels', () => {
  it('strips the package prefix, sorts the names and adds `none`', () => {
    const options = packageOptionsFromLabels([
      '📦 expo-video',
      'needs review',
      '📦 expo-audio',
      'Android',
    ]);
    assert.deepEqual(options, ['expo-audio', 'expo-video', 'none']);
  });
});

describe('buildQuestions', () => {
  it('refuses more package options than a choice question accepts', () => {
    const options = Array.from({ length: 256 }, (_, i) => `expo-pkg-${i}`);
    assert.throws(() => buildQuestions(options), /255/);
    assert.ok(buildQuestions(options.slice(0, 255)));
  });
});

describe('parseAnswers', () => {
  it('refuses a response without an answer to every question', () => {
    const answers = [answer('triage', 'bug_report'), answer('package', 'none')];
    assert.throws(() => parseAnswers(answers, QUESTIONS), /`platform` question/);
  });
});

function plan(answers: IssueClassification, closeInvalid = true) {
  const decisions = decideLabels(answers, { closeInvalid, blockedBy: null });
  return {
    apply: labelsWithStatus(decisions, 'apply'),
    suggest: labelsWithStatus(decisions, 'suggest'),
  };
}

describe('decideLabels', () => {
  it('applies a confident invalid-issue label and suggests a weak one', () => {
    const confident = plan(classification({ triage: ['question', 0.95] }));
    assert.deepEqual(confident, { apply: ['invalid issue: question'], suggest: [] });

    const weak = plan(classification({ triage: ['question', 0.5] }));
    assert.deepEqual(weak, { apply: [], suggest: ['invalid issue: question'] });
  });

  it('needs 0.95 for the feature request label', () => {
    assert.deepEqual(plan(classification({ triage: ['feature_request', 0.94] })).apply, []);
    assert.deepEqual(plan(classification({ triage: ['feature_request', 0.96] })).apply, [
      'invalid issue: feature request',
    ]);
  });

  it('gates question and missing_info on their summed probability', () => {
    const answers = classification({
      triage: ['question', 0.5, { question: 0.55, missing_info: 0.4, bug_report: 0.05 }],
    });
    assert.deepEqual(plan(answers).apply, ['invalid issue: question']);
  });

  it('holds back closing labels when asked, but not the docs label', () => {
    const answers = classification({
      triage: ['feature_request', 0.95],
      package: ['expo-video', 0.95],
      platform: ['android', 0.92],
    });
    assert.deepEqual(plan(answers), {
      apply: ['invalid issue: feature request', '📦 expo-video', 'Android'],
      suggest: [],
    });
    assert.deepEqual(plan(answers, false), {
      apply: ['📦 expo-video', 'Android'],
      suggest: [],
    });
    const docs = plan(classification({ triage: ['documentation', 0.95] }), false);
    assert.deepEqual(docs.apply, ['docs']);
    const redirect = plan(classification({ triage: ['third_party_library', 0.99] }));
    assert.deepEqual(redirect, { apply: [], suggest: [] });
  });

  it('holds a closing label only when it passes its threshold', () => {
    const held = (answers: IssueClassification) =>
      decideLabels(answers, { closeInvalid: false, blockedBy: null }).find(
        (d) => d.status.kind === 'held'
      );
    const summed = held(
      classification({ triage: ['question', 0.55, { question: 0.55, missing_info: 0.4 }] })
    );
    assert.equal(summed?.label, 'invalid issue: question');
    assert.ok(Math.abs((summed?.confidence ?? 0) - 0.95) < 1e-9);
    assert.equal(held(classification({ triage: ['feature_request', 0.94] })), undefined);
    assert.equal(held(classification({ triage: ['documentation', 0.99] })), undefined);
  });

  const answers = classification({ triage: ['feature_request', 0.97], platform: ['ios', 0.95] });
  const cases: [boolean, Blocker | null, LabelDecision['status']][] = [
    [false, null, { kind: 'held', blockedBy: null }],
    [false, 'from an Expo member', { kind: 'held', blockedBy: 'from an Expo member' }],
    [true, null, { kind: 'apply' }],
    [true, 'from an Expo member', { kind: 'held', blockedBy: 'from an Expo member' }],
  ];
  for (const [closeInvalid, blockedBy, status] of cases) {
    it(`closeInvalid=${closeInvalid} blockedBy=${blockedBy}`, () => {
      const decisions = decideLabels(answers, { closeInvalid, blockedBy });
      const closing = decisions.find((d) => d.label === 'invalid issue: feature request');
      assert.deepEqual(closing?.status, status);
      assert.ok(labelsWithStatus(decisions, 'apply').includes('iOS'));
    });
  }
});

describe('closeBlocker', () => {
  it('names the guard that holds back closing labels', () => {
    assert.equal(closeBlocker('open', ['needs validation'], 'NONE'), null);
    assert.equal(closeBlocker('open', ['Issue accepted'], 'NONE'), 'already triaged');
    assert.equal(closeBlocker('closed', [], 'NONE'), 'already triaged');
    assert.equal(closeBlocker('open', [], 'MEMBER'), 'from an Expo member');
  });
});

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

describe('countWouldClose', () => {
  it('counts agreement per closing label and keeps issues without truth apart', () => {
    const counts = new Map();
    const label = 'invalid issue: question';
    countWouldClose(counts, label, { truth: 'question', agrees: true });
    countWouldClose(counts, label, { truth: 'bug_report', agrees: false });
    countWouldClose(counts, label, null);
    countWouldClose(counts, null, { truth: 'bug_report', agrees: false });
    assert.deepEqual(counts.get('invalid issue: question'), { n: 2, agree: 1, noTruth: 1 });
    assert.equal(counts.size, 1);
  });
});

describe('formatReport', () => {
  it('shows the close decision and the gate confidence', () => {
    const answers = classification({
      triage: ['question', 0.55, { question: 0.55, missing_info: 0.4 }],
    });
    const result = { model: 'gpt-6-luna', classification: answers, usage: {} as never };
    const decisions = decideLabels(answers, {
      closeInvalid: false,
      blockedBy: 'from an Expo member',
    });
    const report = formatReport(1, result, decisions, { shadow: false, closeInvalid: false });
    assert.match(report, /\| triage \| question \| 0\.95 \| {2}\|/);
    assert.match(
      report,
      /would close: no, held back \(from an Expo member\): invalid issue: question \(0\.95\)/
    );
    assert.match(report, /suggest: none/);
  });

  it('leaves out the close decision when --close-invalid is on', () => {
    const answers = classification({ triage: ['question', 0.95] });
    const result = { model: 'gpt-6-luna', classification: answers, usage: {} as never };
    const decisions = decideLabels(answers, { closeInvalid: true, blockedBy: null });
    assert.doesNotMatch(
      formatReport(1, result, decisions, { shadow: false, closeInvalid: true }),
      /would close/
    );
  });
});

describe('agreements', () => {
  it('reads truth only from labels a maintainer applies', () => {
    const answers = classification({
      triage: ['question', 0.9],
      package: ['expo-video', 0.9],
      platform: ['android', 0.9],
    });
    assert.deepEqual(agreements(['needs review', MISSING_REPRO_LABEL], answers), {
      triage: null,
      package: null,
      platform: null,
    });
    assert.deepEqual(agreements(['Issue accepted', '📦 expo-video', 'Android', 'iOS'], answers), {
      triage: { truth: 'bug_report', agrees: false },
      package: { truth: 'expo-video', agrees: true },
      platform: { truth: 'multiple_or_unclear', agrees: false },
    });
    assert.equal(agreements(['invalid issue: question'], answers).triage?.agrees, true);
    assert.equal(agreements(['incomplete issue: missing info'], answers).triage?.agrees, true);
  });
});

describe('gateConfidences', () => {
  it('sums question and missing_info for triage', () => {
    const confidences = gateConfidences(
      classification({ triage: ['question', 0.55, { question: 0.55, missing_info: 0.4 }] })
    );
    assert.ok(Math.abs(confidences.triage - 0.95) < 1e-9);
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
