import OpenAI from 'openai';
import type { Decision, DecisionCreateParams } from 'openai/resources/decisions';

import { getIssueAsync, LabelEvent } from './GitHub';

const MODEL = 'gpt-6-luna';

type TriageRule = {
  /**
   * The label the bot applies, or `null` to leave the issue to a maintainer. The off-repo kinds
   * (problems whose fix lives outside expo/expo) stay `null` until the logs show the model is right
   * about them often enough.
   */
  applies: string | null;
  /** The label a maintainer applies. `--evaluate` reads it as truth. */
  truth: string;
  /** Whether the label makes the triage workflow post a canned reply and close the issue. */
  closes: boolean;
  /** Maintainers sometimes accept feature requests as tracking issues, so that label needs more. */
  threshold?: number;
  /**
   * Whether a `.github/ISSUE_TEMPLATE/*.yml` file applies `truth`. GitHub records the issue author
   * as the actor, so the label shows the author's template pick and not a maintainer's decision.
   */
  template?: boolean;
};

/** `--evaluate` reads truth labels in this order, so `bug_report` stays last. */
const TRIAGE_RULES = {
  question: {
    applies: 'invalid issue: question',
    truth: 'invalid issue: question',
    closes: true,
    template: true,
  },
  feature_request: {
    applies: 'invalid issue: feature request',
    truth: 'invalid issue: feature request',
    closes: true,
    threshold: 0.95,
    template: true,
  },
  third_party_library: {
    applies: null,
    truth: 'invalid issue: third-party library',
    closes: true,
  },
  react_native_core: { applies: null, truth: 'invalid issue: react-native-core', closes: true },
  eas_build_troubleshooting: {
    applies: null,
    truth: 'invalid issue: EAS Build troubleshooting',
    closes: true,
  },
  missing_info: {
    applies: 'incomplete issue: missing info',
    truth: 'incomplete issue: missing info',
    closes: true,
  },
  documentation: { applies: 'docs', truth: 'docs', closes: false, template: true },
  bug_report: { applies: null, truth: 'Issue accepted', closes: false },
} satisfies Record<string, TriageRule>;
type TriageKind = keyof typeof TRIAGE_RULES;
const TRIAGE_RULE_ENTRIES = Object.entries(TRIAGE_RULES) as [TriageKind, TriageRule][];
const NOT_ACTIONABLE_KINDS: readonly TriageKind[] = ['question', 'missing_info'];
export const MISSING_REPRO_LABEL = 'incomplete issue: missing or invalid repro';

const PLATFORM_LABELS = {
  android: 'Android',
  ios: 'iOS',
  web: 'Platform: web',
  multiple_or_unclear: null,
} as const;
type PlatformKind = keyof typeof PLATFORM_LABELS;

const PACKAGE_LABEL_PREFIX = '📦 ';
const NO_PACKAGE = 'none';
/** The most options a Decisions API choice question accepts. */
const MAX_CHOICE_OPTIONS = 255;

const DEFAULT_THRESHOLDS: Record<QuestionId, number> = { triage: 0.9, package: 0.9, platform: 0.9 };

const TRUSTED_AUTHOR_LABEL = '!';
const TRIAGED_LABELS: string[] = [
  TRUSTED_AUTHOR_LABEL,
  MISSING_REPRO_LABEL,
  ...TRIAGE_RULE_ENTRIES.map(([, rule]) => rule.truth),
];

const MAX_BODY_CHARACTERS = 60_000;

type GitHubIssue = Awaited<ReturnType<typeof getIssueAsync>>;
export type TriageIssue = Pick<GitHubIssue, 'title' | 'body' | 'author_association' | 'labels'>;
type IssueState = Pick<TriageIssue, 'title' | 'author_association'> & { body: string };

/** Each choice maps to its description, or `null` when the choice value says enough. */
type ChoiceQuestion<K extends string> = {
  instructions: string;
  criteria: Record<K, string | null>;
};
type ChoiceAnswer<K extends string> = {
  choice: K;
  confidence: number;
  probabilities: Partial<Record<K, number>>;
};

type ChoiceKinds = { triage: TriageKind; package: string; platform: PlatformKind };
export type QuestionId = keyof ChoiceKinds;
export const QUESTION_IDS: readonly QuestionId[] = ['triage', 'package', 'platform'];
type IssueQuestions = { [K in QuestionId]: ChoiceQuestion<ChoiceKinds[K]> };
export type IssueClassification = { [K in QuestionId]: ChoiceAnswer<ChoiceKinds[K]> };

export type ClassificationResult = {
  model: string;
  classification: IssueClassification;
  usage: Decision.Usage;
};

const TRIAGE_QUESTION: ChoiceQuestion<TriageKind> = {
  instructions:
    'The input is a GitHub issue as JSON reported against expo/expo, the repository of the Expo SDK and its tooling. ' +
    'Decide which kind of issue it is. Only pick `bug_report` when the author describes concrete, broken behavior in a package maintained in expo/expo.',
  criteria: {
    bug_report: 'A report of broken behavior in a package or tool maintained in expo/expo',
    question:
      'The author asks how to do something, why something behaves as it does, or reports a problem in their own project with no sign of a defect in Expo code',
    feature_request: 'A request for new behavior or an improvement that does not exist yet',
    third_party_library: 'A bug in a library not maintained in expo/expo',
    react_native_core: 'A bug in facebook/react-native itself rather than in Expo tools',
    eas_build_troubleshooting:
      'An EAS Build failure with no evidence of a bug in Expo tools, such as a build log the author wants help reading',
    missing_info:
      'The template sections are blank, deleted, or hold placeholder text, or the report is vague or one line and describes a symptom without steps or code',
    documentation:
      'A problem with the content of docs.expo.dev, such as a wrong, missing, or outdated page, rather than with the code',
  },
};

const PLATFORM_QUESTION: ChoiceQuestion<PlatformKind> = {
  instructions:
    'Decide which platform the issue is about. Pick `multiple_or_unclear` unless the issue is clearly about one platform only.',
  criteria: {
    android: 'Only about Android',
    ios: 'Only about iOS, iPadOS, or macOS',
    web: 'Only about the web platform',
    multiple_or_unclear: 'About more than one platform, or the platform is not stated',
  },
};

function packageQuestion(packageOptions: string[]): ChoiceQuestion<string> {
  if (packageOptions.length > MAX_CHOICE_OPTIONS) {
    throw new Error(
      `Cannot build the package question because the repository has ${packageOptions.length} package options and a Decisions API choice question accepts at most ${MAX_CHOICE_OPTIONS}. ` +
        `Remove \`${PACKAGE_LABEL_PREFIX}\` labels for deprecated packages, or split the question by package group in tools/src/IssueTriage.ts.`
    );
  }
  const criteria: Record<string, string | null> = {};
  for (const option of packageOptions) {
    criteria[option] = option === NO_PACKAGE ? 'Not about one specific expo package' : null;
  }
  return {
    instructions:
      'Decide which expo package the issue is about. Pick the package whose code would have to change to fix the issue. ' +
      `Pick \`${NO_PACKAGE}\` when the issue spans several packages or names none.`,
    criteria,
  };
}

/**
 * Returns the package names that the repository has a `📦 ` label for, plus `none`.
 */
export function packageOptionsFromLabels(labelNames: string[]): string[] {
  const packages = labelNames
    .filter((name) => name.startsWith(PACKAGE_LABEL_PREFIX))
    .map((name) => name.slice(PACKAGE_LABEL_PREFIX.length))
    .sort();
  return [...packages, NO_PACKAGE];
}

export function buildQuestions(packageOptions: string[]): IssueQuestions {
  return {
    triage: TRIAGE_QUESTION,
    package: packageQuestion(packageOptions),
    platform: PLATFORM_QUESTION,
  };
}

function buildState(issue: TriageIssue): IssueState {
  return {
    title: issue.title,
    body: (issue.body ?? '').slice(0, MAX_BODY_CHARACTERS),
    author_association: issue.author_association,
  };
}

export async function classifyIssueAsync(
  issue: TriageIssue,
  packageOptions: string[]
): Promise<ClassificationResult> {
  const questions = buildQuestions(packageOptions);
  const { model, answers, usage } = await new OpenAI().decisions.create({
    model: MODEL,
    input: JSON.stringify(buildState(issue)),
    questions: QUESTION_IDS.map((id) => toDecisionQuestion(id, questions[id])),
  });
  return { model, classification: parseAnswers(answers, questions), usage };
}

function toDecisionQuestion(
  name: QuestionId,
  { instructions, criteria }: ChoiceQuestion<string>
): DecisionCreateParams.QuestionParamChoice {
  return {
    type: 'choice',
    name,
    instructions,
    choices: Object.entries(criteria).map(([value, description]) =>
      description ? { value, description } : { value }
    ),
  };
}

export function parseAnswers(
  answers: Decision['answers'],
  questions: IssueQuestions
): IssueClassification {
  return {
    triage: parseAnswer(answers, 'triage', questions.triage),
    package: parseAnswer(answers, 'package', questions.package),
    platform: parseAnswer(answers, 'platform', questions.platform),
  };
}

function parseAnswer<K extends string>(
  answers: Decision['answers'],
  name: QuestionId,
  { criteria }: ChoiceQuestion<K>
): ChoiceAnswer<K> {
  const answer = answers.find((candidate) => candidate.name === name);
  if (!answer) {
    throw new Error(
      `Cannot classify the issue because the model returned no answer to the \`${name}\` question. ` +
        'The Decisions API answers every question it is sent, so the response is malformed. Run the command again, or label the issue by hand.'
    );
  }
  if (answer.type !== 'choice') {
    throw new Error(
      `Cannot classify the issue because the model returned a \`${answer.type}\` answer to the \`${answer.name}\` question instead of a choice. ` +
        'The model refuses a question when it declines to judge the input. Label the issue by hand.'
    );
  }
  const choice = String(answer.choice);
  if (!isChoice(choice, criteria)) {
    throw new Error(
      `Cannot classify the issue because the model answered \`${choice}\` to the \`${name}\` question, which is not one of its choices. ` +
        'The Decisions API only returns choices it is sent, so the response is malformed. Run the command again, or label the issue by hand.'
    );
  }
  const probabilities: Partial<Record<K, number>> = {};
  for (const { value, probability } of answer.probabilities) {
    const key = String(value);
    if (isChoice(key, criteria)) {
      probabilities[key] = probability;
    }
  }
  return { choice, confidence: answer.confidence, probabilities };
}

function isChoice<K extends string>(value: string, criteria: Record<K, string | null>): value is K {
  return value in criteria;
}

type LabelCandidate = {
  question: QuestionId;
  label: string;
  confidence: number;
  threshold: number;
  closes: boolean;
};

/**
 * The confidence that `decideLabels` compares with the threshold for each question.
 */
export function gateConfidences(classification: IssueClassification): Record<QuestionId, number> {
  const { triage, package: pkg, platform } = classification;
  return {
    triage: NOT_ACTIONABLE_KINDS.includes(triage.choice)
      ? (triage.probabilities.question ?? 0) + (triage.probabilities.missing_info ?? 0)
      : triage.confidence,
    package: pkg.confidence,
    platform: platform.confidence,
  };
}

function labelCandidates(classification: IssueClassification): LabelCandidate[] {
  const { triage, package: pkg, platform } = classification;
  const confidences = gateConfidences(classification);
  const candidates: LabelCandidate[] = [];

  const triageRule: TriageRule = TRIAGE_RULES[triage.choice];
  if (triageRule.applies) {
    candidates.push({
      question: 'triage',
      label: triageRule.applies,
      confidence: confidences.triage,
      threshold: triageRule.threshold ?? DEFAULT_THRESHOLDS.triage,
      closes: triageRule.closes,
    });
  }

  if (pkg.choice !== NO_PACKAGE) {
    candidates.push({
      question: 'package',
      label: PACKAGE_LABEL_PREFIX + pkg.choice,
      confidence: confidences.package,
      threshold: DEFAULT_THRESHOLDS.package,
      closes: false,
    });
  }

  const platformLabel = PLATFORM_LABELS[platform.choice];
  if (platformLabel) {
    candidates.push({
      question: 'platform',
      label: platformLabel,
      confidence: confidences.platform,
      threshold: DEFAULT_THRESHOLDS.platform,
      closes: false,
    });
  }

  return candidates;
}

export type Blocker = 'already triaged' | 'from an Expo member';

/**
 * `held` marks a closing label that passed its threshold but may not be applied. `blockedBy` is
 * `null` when only the missing `--close-invalid` flag holds it back.
 */
type LabelStatus =
  | { kind: 'apply' }
  | { kind: 'suggest' }
  | { kind: 'held'; blockedBy: Blocker | null };
export type LabelDecision = LabelCandidate & { status: LabelStatus };

/**
 * Decides every candidate label. A closing label that may not be applied and misses its threshold
 * is left out, so it is neither suggested nor reported as held.
 */
export function decideLabels(
  classification: IssueClassification,
  { closeInvalid, blockedBy }: { closeInvalid: boolean; blockedBy: Blocker | null }
): LabelDecision[] {
  const closingAllowed = closeInvalid && !blockedBy;
  return labelCandidates(classification).flatMap((candidate): LabelDecision[] => {
    const passes = candidate.confidence >= candidate.threshold;
    if (candidate.closes && !closingAllowed) {
      return passes ? [{ ...candidate, status: { kind: 'held', blockedBy } }] : [];
    }
    return [{ ...candidate, status: { kind: passes ? 'apply' : 'suggest' } }];
  });
}

export function labelsWithStatus(decisions: LabelDecision[], kind: LabelStatus['kind']): string[] {
  return decisions.filter((decision) => decision.status.kind === kind).map((d) => d.label);
}

/** The guard that keeps `--close-invalid` from closing the issue, or `null`. */
export function closeBlocker(
  state: string,
  labels: string[],
  authorAssociation: string
): Blocker | null {
  if (isAlreadyTriaged(state, labels)) {
    return 'already triaged';
  }
  return isTeamAuthor(authorAssociation) ? 'from an Expo member' : null;
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

export type WouldCloseCounts = { n: number; agree: number; noTruth: number };

export function countWouldClose(
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

export function formatReport(
  issueNumber: number,
  result: ClassificationResult,
  decisions: LabelDecision[],
  {
    shadow,
    closeInvalid,
  }: {
    shadow: boolean;
    /** Leaves out the close line, because the applied column already shows the result. */
    closeInvalid: boolean;
  }
): string {
  const confidences = gateConfidences(result.classification);
  const rows = QUESTION_IDS.map((id) => {
    const decision = decisions.find((d) => d.question === id);
    const applied = decision?.status.kind === 'apply' ? decision.label : '';
    return `| ${id} | ${result.classification[id].choice} | ${confidences[id].toFixed(2)} | ${applied} |`;
  });
  const suggest = labelsWithStatus(decisions, 'suggest');

  return [
    `### Classification of issue #${issueNumber} (${result.model})`,
    '',
    `| question | answer | confidence | ${shadow ? 'would apply' : 'applied'} |`,
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    ...(closeInvalid ? [] : [`would close: ${formatWouldClose(decisions)}`]),
    `suggest: ${suggest.length > 0 ? suggest.join(', ') : 'none'}`,
  ].join('\n');
}

function formatWouldClose(decisions: LabelDecision[]): string {
  const held = decisions.find((d) => d.status.kind === 'held');
  if (held?.status.kind !== 'held') {
    return 'no';
  }
  const label = `${held.label} (${held.confidence.toFixed(2)})`;
  return held.status.blockedBy ? `no, held back (${held.status.blockedBy}): ${label}` : label;
}

/**
 * Whether a maintainer or the validator already decided about the issue, so `--close-invalid` must not
 * add a closing label. Non-closing labels only need the issue to be open.
 */
function isAlreadyTriaged(state: string, labels: string[]): boolean {
  return state !== 'open' || labels.some((label) => TRIAGED_LABELS.includes(label));
}

const TEAM_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR'];

/**
 * Whether an Expo member or collaborator opened the issue. They file tracking issues with the bug
 * template, so `--close-invalid` must not close their issues.
 */
function isTeamAuthor(authorAssociation: string): boolean {
  return TEAM_ASSOCIATIONS.includes(authorAssociation);
}

const BOT_ACTORS = ['expo-bot', 'github-actions[bot]'];
const TEMPLATE_LABELS: string[] = TRIAGE_RULE_ENTRIES.filter(([, rule]) => rule.template).map(
  ([, rule]) => rule.truth
);
/** The one-off backfill of 2026-09-22 ran under a personal token, so its labels look human. */
const BACKFILL_WINDOW = { from: '2026-09-22T20:20:00Z', to: '2026-09-22T20:45:00Z' };

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

export type Agreement = { truth: string; agrees: boolean };

/**
 * Compares each answer with the truth a maintainer's labels carry. `null` means the labels
 * carry no signal for that question. Labels the validator bot applies (`needs review`,
 * the missing-repro label) are not truth.
 */
export function agreements(
  labels: string[],
  classification: IssueClassification
): Record<QuestionId, Agreement | null> {
  const triage = triageTruth(labels);
  const packages = labels
    .filter((name) => name.startsWith(PACKAGE_LABEL_PREFIX))
    .map((name) => name.slice(PACKAGE_LABEL_PREFIX.length));
  const platform = platformTruth(labels);

  return {
    triage: triage && {
      truth: triage,
      agrees:
        triage === classification.triage.choice ||
        (NOT_ACTIONABLE_KINDS.includes(triage) &&
          NOT_ACTIONABLE_KINDS.includes(classification.triage.choice)),
    },
    package:
      packages.length > 0
        ? { truth: packages.join('+'), agrees: packages.includes(classification.package.choice) }
        : null,
    platform: platform && { truth: platform, agrees: platform === classification.platform.choice },
  };
}

function triageTruth(labels: string[]): TriageKind | null {
  const entry = TRIAGE_RULE_ENTRIES.find(([, rule]) => labels.includes(rule.truth));
  return entry ? entry[0] : null;
}

function platformTruth(labels: string[]): PlatformKind | null {
  const kinds = (Object.entries(PLATFORM_LABELS) as [PlatformKind, string | null][])
    .filter(([, label]) => label !== null && labels.includes(label))
    .map(([kind]) => kind);
  if (kinds.length === 0) {
    return null;
  }
  return kinds.length === 1 ? kinds[0] : 'multiple_or_unclear';
}
