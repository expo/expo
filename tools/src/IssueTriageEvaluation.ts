import { labelNames, LabelEvent } from './GitHub';
import {
  Agreement,
  agreements,
  closeBlocker,
  decideLabels,
  gateConfidences,
  IssueClassification,
  labelsWithStatus,
  QUESTION_IDS,
  QuestionId,
  TEMPLATE_LABELS,
  TriageIssue,
} from './IssueTriage';

export type EvaluatedIssue = TriageIssue & {
  number: number;
  user: { login: string } | null;
};

export type IssueScore = {
  confidences: Record<QuestionId, number>;
  agreement: Record<QuestionId, Agreement | null>;
  /** `null` when the live step could not have closed the issue. */
  wouldClose: { label: string | null; truth: Agreement | null } | null;
};

const BUCKETS = ['>=0.9', '0.7-0.9', '<0.7'] as const;
type Bucket = (typeof BUCKETS)[number];
type Counts = { n: number; agree: number };
type WouldCloseCounts = Counts & { noTruth: number };
type Tally = { buckets: Record<Bucket, Counts>; truths: Map<string, Counts> };

export type Evaluation = {
  tallies: Record<QuestionId, Tally>;
  wouldClose: Map<string, WouldCloseCounts>;
  closable: number;
};

const BOT_ACTORS = ['expo-bot', 'github-actions[bot]'];
/** The one-off backfill of 2026-09-22 ran under a personal token, so its labels look human. */
const BACKFILL_WINDOW = { from: '2026-09-22T20:20:00Z', to: '2026-09-22T20:45:00Z' };

export function scoreIssue(
  issue: EvaluatedIssue,
  classification: IssueClassification,
  events: LabelEvent[]
): IssueScore {
  const truthLabels = humanAppliedLabels(labelNames(issue.labels), events, issue.user?.login ?? '');
  const agreement = agreements(truthLabels, classification);
  const shadow = decideLabels(classification, { closeInvalid: false, blockedBy: null });
  return {
    confidences: gateConfidences(classification),
    agreement,
    wouldClose: couldCloseWhenOpened(issue, events)
      ? { label: labelsWithStatus(shadow, 'held')[0] ?? null, truth: agreement.triage }
      : null,
  };
}

export function summarize(scores: IssueScore[]): Evaluation {
  const tallies = Object.fromEntries(QUESTION_IDS.map((id) => [id, emptyTally()])) as Record<
    QuestionId,
    Tally
  >;
  const wouldClose = new Map<string, WouldCloseCounts>();
  let closable = 0;
  for (const score of scores) {
    for (const id of QUESTION_IDS) {
      tally(tallies[id], score.confidences[id], score.agreement[id]);
    }
    if (score.wouldClose) {
      closable += 1;
      countWouldClose(wouldClose, score.wouldClose.label, score.wouldClose.truth);
    }
  }
  return { tallies, wouldClose, closable };
}

/**
 * Whether the live step could have closed the issue. Only template labels from the author and
 * labels from the bot exist before the step runs. Maintainers label the issue later.
 */
export function couldCloseWhenOpened(
  issue: { user: { login: string } | null; author_association: string },
  events: LabelEvent[]
): boolean {
  const labels = events
    .filter(
      (event) =>
        BOT_ACTORS.includes(event.actor) ||
        (event.actor === issue.user?.login && TEMPLATE_LABELS.includes(event.label))
    )
    .map((event) => event.label);
  return closeBlocker('open', labels, issue.author_association) === null;
}

/**
 * The labels currently on the issue that a person applied. Labels from the bot account and
 * from the 2026-09-22 backfill are classifier output and must not count as truth. Template labels
 * applied as the author are not truth either.
 */
export function humanAppliedLabels(
  currentLabels: string[],
  events: LabelEvent[],
  author: string
): string[] {
  const human = new Set(
    events
      .filter(
        (event) =>
          !BOT_ACTORS.includes(event.actor) &&
          !(event.actor === author && TEMPLATE_LABELS.includes(event.label)) &&
          (event.createdAt < BACKFILL_WINDOW.from || event.createdAt > BACKFILL_WINDOW.to)
      )
      .map((event) => event.label)
  );
  return currentLabels.filter((label) => human.has(label));
}

function countWouldClose(
  counts: Map<string, WouldCloseCounts>,
  label: string | null,
  truth: Agreement | null
) {
  if (!label) {
    return;
  }
  const entry = counts.get(label) ?? { n: 0, agree: 0, noTruth: 0 };
  counts.set(label, entry);
  if (!truth) {
    entry.noTruth += 1;
    return;
  }
  entry.n += 1;
  entry.agree += truth.agrees ? 1 : 0;
}

function tally(tally: Tally, confidence: number, agreement: Agreement | null) {
  if (agreement === null) {
    return;
  }
  const truth = tally.truths.get(agreement.truth) ?? { n: 0, agree: 0 };
  tally.truths.set(agreement.truth, truth);
  for (const counts of [tally.buckets[bucketOf(confidence)], truth]) {
    counts.n += 1;
    counts.agree += agreement.agrees ? 1 : 0;
  }
}

function bucketOf(confidence: number): Bucket {
  if (confidence >= 0.9) {
    return '>=0.9';
  }
  return confidence >= 0.7 ? '0.7-0.9' : '<0.7';
}

function emptyTally(): Tally {
  return {
    buckets: {
      '>=0.9': { n: 0, agree: 0 },
      '0.7-0.9': { n: 0, agree: 0 },
      '<0.7': { n: 0, agree: 0 },
    },
    truths: new Map(),
  };
}

export function formatEvaluation(
  { tallies, wouldClose, closable }: Evaluation,
  {
    model,
    inputTokens,
    issueCount,
    failures,
  }: { model: string; inputTokens: number; issueCount: number; failures: number }
): string {
  const lines = [
    `### Calibration over ${issueCount} closed issues (${model || 'no model'}, ${failures} failed)`,
    '',
    'Truth comes from labels a person applied. Labels from expo-bot, from the 2026-09-22 backfill, and from issue templates are ignored. Issues without such a label are left out of a question.',
  ];

  for (const id of QUESTION_IDS) {
    const { buckets, truths } = tallies[id];
    const total = { n: 0, agree: 0 };
    lines.push(
      '',
      `#### ${id}`,
      '',
      '| confidence | n | agree | agree % |',
      '| --- | --- | --- | --- |'
    );
    for (const bucket of BUCKETS) {
      lines.push(row(bucket, buckets[bucket]));
      total.n += buckets[bucket].n;
      total.agree += buckets[bucket].agree;
    }
    lines.push(row('all', total));
    lines.push('', '| truth | n | agree | agree % |', '| --- | --- | --- | --- |');
    for (const [truth, counts] of [...truths].sort((a, b) => b[1].n - a[1].n)) {
      lines.push(row(truth, counts));
    }
  }

  lines.push(
    '',
    '#### would close',
    '',
    `Only the ${closable} issues that the live step could close: no team author, no triage label from the issue template, and no triage label from the bot.`,
    '',
    '| label | n | agree | agree % | no truth |',
    '| --- | --- | --- | --- | --- |'
  );
  for (const [label, counts] of wouldClose) {
    lines.push(`${row(label, counts)} ${counts.noTruth} |`);
  }

  lines.push('', `total input tokens: ${inputTokens}`);
  return lines.join('\n');
}

function row(label: string, counts: Counts): string {
  const percent = counts.n > 0 ? `${((counts.agree / counts.n) * 100).toFixed(1)}%` : '-';
  return `| ${label} | ${counts.n} | ${counts.agree} | ${percent} |`;
}
