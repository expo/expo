import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  agreements,
  buildQuestions,
  humanAppliedLabels,
  IssueClassification,
  isAlreadyTriaged,
  MISSING_REPRO_LABEL,
  packageOptionsFromLabels,
  planLabels,
  QuestionId,
} from './IssueTriage';

type Choices = {
  [K in QuestionId]?: [IssueClassification[K]['choice'], number, Record<string, number>?];
};

function classification(overrides: Choices = {}): IssueClassification {
  const choices: Record<QuestionId, [string, number, Record<string, number>?]> = {
    triage: ['bug_report', 0.99],
    package: ['none', 0.99],
    platform: ['multiple_or_unclear', 0.99],
    ...overrides,
  };
  const answers: Record<string, unknown> = {};
  for (const id of Object.keys(choices) as QuestionId[]) {
    const [choice, confidence, probabilities] = choices[id];
    answers[id] = {
      type: 'choice',
      choice,
      confidence,
      probabilities: probabilities ?? { question: 0, missing_info: 0, [choice]: confidence },
    };
  }
  return answers as IssueClassification;
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

describe('planLabels', () => {
  it('applies a confident invalid-issue label and suggests a weak one', () => {
    const confident = planLabels(classification({ triage: ['question', 0.95] }));
    assert.deepEqual(confident, { apply: ['invalid issue: question'], suggest: [] });

    const weak = planLabels(classification({ triage: ['question', 0.5] }));
    assert.deepEqual(weak, { apply: [], suggest: ['invalid issue: question'] });
  });

  it('needs 0.95 for the feature request label', () => {
    assert.deepEqual(planLabels(classification({ triage: ['feature_request', 0.94] })).apply, []);
    assert.deepEqual(planLabels(classification({ triage: ['feature_request', 0.96] })).apply, [
      'invalid issue: feature request',
    ]);
  });

  it('gates question and missing_info on their summed probability', () => {
    const jev = classification({
      triage: ['question', 0.5, { question: 0.55, missing_info: 0.4, bug_report: 0.05 }],
    });
    assert.deepEqual(planLabels(jev).apply, ['invalid issue: question']);
  });

  it('holds back closing labels when asked, but not the docs label', () => {
    const jev = classification({
      triage: ['feature_request', 0.95],
      package: ['expo-video', 0.95],
      platform: ['android', 0.92],
    });
    assert.deepEqual(planLabels(jev), {
      apply: ['invalid issue: feature request', '📦 expo-video', 'Android'],
      suggest: [],
    });
    assert.deepEqual(planLabels(jev, { closing: false }), {
      apply: ['📦 expo-video', 'Android'],
      suggest: ['invalid issue: feature request'],
    });
    const docs = planLabels(classification({ triage: ['documentation', 0.95] }), {
      closing: false,
    });
    assert.deepEqual(docs.apply, ['docs']);
    const redirect = planLabels(classification({ triage: ['third_party_library', 0.99] }));
    assert.deepEqual(redirect, { apply: [], suggest: [] });
  });
});

describe('agreements', () => {
  it('reads truth only from labels a maintainer applies', () => {
    const jev = classification({
      triage: ['question', 0.9],
      package: ['expo-video', 0.9],
      platform: ['android', 0.9],
    });
    assert.deepEqual(agreements(['needs review', MISSING_REPRO_LABEL], jev), {
      triage: null,
      package: null,
      platform: null,
    });
    assert.deepEqual(agreements(['Issue accepted', '📦 expo-video', 'Android', 'iOS'], jev), {
      triage: { truth: 'bug_report', agrees: false },
      package: { truth: 'expo-video', agrees: true },
      platform: { truth: 'multiple_or_unclear', agrees: false },
    });
    assert.equal(agreements(['invalid issue: question'], jev).triage?.agrees, true);
    assert.equal(agreements(['incomplete issue: missing info'], jev).triage?.agrees, true);
  });
});

describe('isAlreadyTriaged', () => {
  it('is true for closed issues and issues a maintainer or the validator labeled', () => {
    assert.equal(isAlreadyTriaged('open', ['needs validation']), false);
    assert.equal(isAlreadyTriaged('closed', []), true);
    assert.equal(isAlreadyTriaged('open', ['Issue accepted']), true);
    assert.equal(isAlreadyTriaged('open', [MISSING_REPRO_LABEL]), true);
    assert.equal(isAlreadyTriaged('open', ['!']), true);
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
      ]
    );
    assert.deepEqual(labels, ['Issue accepted', 'Android']);
  });
});
