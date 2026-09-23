import {
  ChoiceCriteria,
  ChoiceQuestion,
  SystemOneResult,
  TypeSafeClient,
  Usage,
} from '@typesafe-ai/sdk';

import { getIssueAsync, LabelEvent } from './GitHub';

/**
 * Kinds that map to `null` produce no label, so the issue falls through to a maintainer.
 * The three off-repo kinds (third-party library, react-native core, EAS Build troubleshooting:
 * problems whose fix lives outside expo/expo) stay `null` until the logs show Jev is right about
 * them often enough.
 */
export const TRIAGE_LABELS = {
  bug_report: null,
  question: 'invalid issue: question',
  feature_request: 'invalid issue: feature request',
  third_party_library: null,
  react_native_core: null,
  eas_build_troubleshooting: null,
  missing_info: 'incomplete issue: missing info',
  documentation: 'docs',
} as const;
export type TriageKind = keyof typeof TRIAGE_LABELS;
/**
 * The labels maintainers use for the off-repo kinds (problems whose fix lives outside expo/expo).
 * `--evaluate` reads them as truth. Nothing applies them.
 */
const TRIAGE_TRUTH_LABELS: Record<TriageKind, string | null> = {
  ...TRIAGE_LABELS,
  third_party_library: 'invalid issue: third-party library',
  react_native_core: 'invalid issue: react-native-core',
  eas_build_troubleshooting: 'invalid issue: EAS Build troubleshooting',
};
const NOT_ACTIONABLE_KINDS: readonly TriageKind[] = ['question', 'missing_info'];
/** Labels that make the triage workflow post a canned reply and close the issue. */
const CLOSING_LABELS: string[] = Object.values(TRIAGE_LABELS).filter(
  (label) => label !== null && label !== TRIAGE_LABELS.documentation
);
export const MISSING_REPRO_LABEL = 'incomplete issue: missing or invalid repro';

export const PLATFORM_LABELS = {
  android: 'Android',
  ios: 'iOS',
  web: 'Platform: web',
  multiple_or_unclear: null,
} as const;
export type PlatformKind = keyof typeof PLATFORM_LABELS;

export const PACKAGE_LABEL_PREFIX = '📦 ';
export const NO_PACKAGE = 'none';
/** The most options a Jev choice question accepts. */
const MAX_CHOICE_OPTIONS = 255;

export const DEFAULT_THRESHOLDS = { triage: 0.9, package: 0.9, platform: 0.9 } as const;
export type Thresholds = typeof DEFAULT_THRESHOLDS;
export const QUESTION_IDS = Object.keys(DEFAULT_THRESHOLDS) as QuestionId[];
/** Maintainers sometimes accept feature requests as tracking issues, so that label needs more. */
const LABEL_THRESHOLDS: Record<string, number> = { [TRIAGE_LABELS.feature_request]: 0.95 };

export type PlanOptions = {
  thresholds?: Thresholds;
  /** Whether labels that close the issue may be applied. Defaults to true. */
  closing?: boolean;
};

const ACCEPTED_LABEL = 'Issue accepted';
const TRUSTED_AUTHOR_LABEL = '!';
const TRIAGED_LABELS: string[] = [
  ACCEPTED_LABEL,
  TRUSTED_AUTHOR_LABEL,
  MISSING_REPRO_LABEL,
  ...Object.values(TRIAGE_TRUTH_LABELS).filter((label) => label !== null),
];

const MAX_BODY_CHARACTERS = 60_000;

type GitHubIssue = Awaited<ReturnType<typeof getIssueAsync>>;
export type TriageIssue = Pick<GitHubIssue, 'title' | 'body' | 'author_association' | 'labels'>;
type IssueState = Pick<TriageIssue, 'title' | 'author_association'> & { body: string };

type IssueQuestions = {
  triage: ChoiceQuestion<Record<TriageKind, string>>;
  package: ChoiceQuestion<ChoiceCriteria>;
  platform: ChoiceQuestion<Record<PlatformKind, string>>;
};
export type IssueClassification = SystemOneResult<IssueQuestions>['answers'];
export type QuestionId = keyof IssueClassification;

export type ClassificationResult = {
  model: string;
  classification: IssueClassification;
  usage: Usage;
};

export type LabelPlan = {
  apply: string[];
  suggest: string[];
};

const TRIAGE_QUESTION: ChoiceQuestion<Record<TriageKind, string>> = {
  type: 'choice',
  instructions:
    'The state is a GitHub issue reported against expo/expo, the repository of the Expo SDK and its tooling. ' +
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

const PLATFORM_QUESTION: ChoiceQuestion<Record<PlatformKind, string>> = {
  type: 'choice',
  instructions:
    'Decide which platform the issue is about. Pick `multiple_or_unclear` unless the issue is clearly about one platform only.',
  criteria: {
    android: 'Only about Android',
    ios: 'Only about iOS, iPadOS, or macOS',
    web: 'Only about the web platform',
    multiple_or_unclear: 'About more than one platform, or the platform is not stated',
  },
};

function packageQuestion(packageOptions: string[]): ChoiceQuestion<ChoiceCriteria> {
  if (packageOptions.length > MAX_CHOICE_OPTIONS) {
    throw new Error(
      `Cannot build the package question because the repository has ${packageOptions.length} package options and a Jev choice question accepts at most ${MAX_CHOICE_OPTIONS}. ` +
        `Remove \`${PACKAGE_LABEL_PREFIX}\` labels for deprecated packages, or split the question by package group in tools/src/IssueTriage.ts.`
    );
  }
  const criteria: Record<string, string | null> = {};
  for (const option of packageOptions) {
    criteria[option] = option === NO_PACKAGE ? 'Not about one specific expo package' : null;
  }
  return {
    type: 'choice',
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

export function buildState(issue: TriageIssue): IssueState {
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
  const client = new TypeSafeClient({ logLevel: 'error' });
  const { model, answers, usage } = await client.systemOne({
    state: buildState(issue),
    questions: buildQuestions(packageOptions),
  });
  return { model, classification: answers, usage };
}

type LabelCandidate = {
  question: QuestionId;
  label: string;
  confidence: number;
};

function labelCandidates(classification: IssueClassification): LabelCandidate[] {
  const { triage, package: pkg, platform } = classification;
  const candidates: LabelCandidate[] = [];

  const triageLabel = TRIAGE_LABELS[triage.choice];
  if (triageLabel) {
    candidates.push({
      question: 'triage',
      label: triageLabel,
      confidence: NOT_ACTIONABLE_KINDS.includes(triage.choice)
        ? triage.probabilities.question + triage.probabilities.missing_info
        : triage.confidence,
    });
  }

  if (pkg.choice !== NO_PACKAGE) {
    candidates.push({
      question: 'package',
      label: PACKAGE_LABEL_PREFIX + pkg.choice,
      confidence: pkg.confidence,
    });
  }

  const platformLabel = PLATFORM_LABELS[platform.choice];
  if (platformLabel) {
    candidates.push({
      question: 'platform',
      label: platformLabel,
      confidence: platform.confidence,
    });
  }

  return candidates;
}

export function planLabels(
  classification: IssueClassification,
  { thresholds = DEFAULT_THRESHOLDS, closing = true }: PlanOptions = {}
): LabelPlan {
  const apply: string[] = [];
  const suggest: string[] = [];

  for (const candidate of labelCandidates(classification)) {
    const allowed = closing || !CLOSING_LABELS.includes(candidate.label);
    const threshold = LABEL_THRESHOLDS[candidate.label] ?? thresholds[candidate.question];
    const target = allowed && candidate.confidence >= threshold ? apply : suggest;
    target.push(candidate.label);
  }

  return { apply, suggest };
}

export function formatReport(
  issueNumber: number,
  result: ClassificationResult,
  plan: LabelPlan,
  shadow: boolean
): string {
  const labels = new Map(labelCandidates(result.classification).map((c) => [c.question, c.label]));
  const rows = (Object.keys(result.classification) as QuestionId[]).map((id) => {
    const answer = result.classification[id];
    const label = labels.get(id);
    const applied = label && plan.apply.includes(label) ? label : '';
    return `| ${id} | ${answer.choice} | ${answer.confidence.toFixed(2)} | ${applied} |`;
  });

  return [
    `### Jev classification of issue #${issueNumber} (${result.model})`,
    '',
    `| question | answer | confidence | ${shadow ? 'would apply' : 'applied'} |`,
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    `suggest: ${plan.suggest.length > 0 ? plan.suggest.join(', ') : 'none'}`,
  ].join('\n');
}

/**
 * Whether a maintainer or the validator already decided about the issue, so `--close-invalid` must not
 * add a closing label. Non-closing labels only need the issue to be open.
 */
export function isAlreadyTriaged(state: string, labels: string[]): boolean {
  return state !== 'open' || labels.some((label) => TRIAGED_LABELS.includes(label));
}

const BOT_ACTORS = ['expo-bot', 'github-actions[bot]'];
/** The one-off backfill of 2026-09-22 ran under a personal token, so its labels look human. */
const BACKFILL_WINDOW = { from: '2026-09-22T20:20:00Z', to: '2026-09-22T20:45:00Z' };

/**
 * The labels currently on the issue that a person applied. Labels from the bot account and
 * from the Jev backfill are Jev's own output and must not count as truth.
 */
export function humanAppliedLabels(currentLabels: string[], events: LabelEvent[]): string[] {
  const human = new Set(
    events
      .filter(
        (event) =>
          !BOT_ACTORS.includes(event.actor) &&
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
  for (const [kind, label] of Object.entries(TRIAGE_TRUTH_LABELS) as [
    TriageKind,
    string | null,
  ][]) {
    if (label && labels.includes(label)) {
      return kind;
    }
  }
  return labels.includes(ACCEPTED_LABEL) ? 'bug_report' : null;
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
