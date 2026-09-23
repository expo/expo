import { Command } from '@expo/commander';
import fs from 'fs';

import {
  addIssueLabelsAsync,
  getIssueAsync,
  labelNames,
  listIssueLabelEventsAsync,
  listRecentIssuesAsync,
  listRepoLabelNamesAsync,
} from '../GitHub';
import {
  Agreement,
  agreements,
  classifyIssueAsync,
  formatReport,
  humanAppliedLabels,
  isAlreadyTriaged,
  packageOptionsFromLabels,
  planLabels,
  QUESTION_IDS,
  QuestionId,
  TriageIssue,
} from '../IssueTriage';
import logger from '../Logger';

type ActionOptions = {
  issue?: string;
  tag?: boolean;
  closeInvalid?: boolean;
  evaluate?: string | boolean;
};

export default (program: Command) => {
  program
    .command('classify-issue')
    .description('Classifies a GitHub issue with Jev and reports the labels it would apply.')
    .option('-i, --issue <number>', 'Number of the issue to classify.')
    .option(
      '--tag',
      'Adds the package, platform, and docs labels instead of only reporting them.',
      false
    )
    .option(
      '--close-invalid',
      'With --tag, also labels issues that are questions, feature requests, or missing info. Each of those labels makes the triage workflow post a canned reply and close the issue.',
      false
    )
    .option(
      '--evaluate [limit]',
      'Measures agreement with human labels over recent closed issues. Defaults to 100 issues.'
    )
    .asyncAction(action);
};

const DEFAULT_EVALUATE_LIMIT = 100;
const EVALUATE_CONCURRENCY = 8;

async function action(options: ActionOptions) {
  requireEnv(
    'GITHUB_TOKEN',
    'The command reads the issue and the repository labels through the GitHub API, which rejects unauthenticated requests.',
    'Export a token with `repo` scope as `GITHUB_TOKEN` and run the command again.'
  );
  requireEnv(
    'TYPESAFE_API_KEY',
    'The command classifies the issue with the Jev model hosted by TypeSafe AI, which rejects unauthenticated requests.',
    'Create a key at https://console.typesafe.ai/keys and export it as `TYPESAFE_API_KEY`.'
  );

  if (options.evaluate) {
    await evaluateAsync(parseLimit(options.evaluate));
    return;
  }
  if (!options.issue || isNaN(Number(options.issue))) {
    throw new Error(
      'Flag `--issue` must be provided with a number value. ' +
        'Without it the command does not know which issue to classify. ' +
        'Run `et classify-issue --issue 12345`, or `et classify-issue --evaluate` to measure the model against past issues.'
    );
  }
  await classifyOneAsync(
    Number(options.issue),
    Boolean(options.tag),
    Boolean(options.closeInvalid)
  );
}

async function classifyOneAsync(issueNumber: number, apply: boolean, closing: boolean) {
  const [issue, labelNamesInRepo] = await Promise.all([
    getIssueAsync(issueNumber),
    listRepoLabelNamesAsync(),
  ]);
  const result = await classifyIssueAsync(issue, packageOptionsFromLabels(labelNamesInRepo));

  if (apply && issue.state !== 'open') {
    logger.warn(`Issue #${issueNumber} is closed, reporting only.`);
    apply = false;
  }
  if (apply && closing && isAlreadyTriaged(issue.state, labelNames(issue.labels))) {
    logger.warn(`Issue #${issueNumber} is already triaged, holding back closing labels.`);
    closing = false;
  }
  const plan = planLabels(result.classification, { closing: !apply || closing });
  if (apply && plan.apply.length > 0) {
    await addIssueLabelsAsync(issueNumber, plan.apply);
  }

  const report = formatReport(issueNumber, result, plan, !apply);
  console.log(report);
  appendStepSummary(report);
}

async function evaluateAsync(limit: number) {
  const [labelNamesInRepo, issues] = await Promise.all([
    listRepoLabelNamesAsync(),
    listClosedIssuesAsync(limit),
  ]);
  const packageOptions = packageOptionsFromLabels(labelNamesInRepo);
  const tallies = Object.fromEntries(QUESTION_IDS.map((id) => [id, emptyTally()])) as Record<
    QuestionId,
    Tally
  >;

  let model = '';
  let inputTokens = 0;
  let failures = 0;

  const pending = issues.entries();
  const worker = async () => {
    for (const [index, issue] of pending) {
      const prefix = `[${index + 1}/${issues.length}] #${issue.number}`;
      let result;
      let events;
      try {
        [result, events] = await Promise.all([
          classifyIssueAsync(issue, packageOptions),
          listIssueLabelEventsAsync(issue.number),
        ]);
      } catch (error) {
        failures += 1;
        logger.warn(`${prefix} skipped: ${error instanceof Error ? error.message : error}`);
        continue;
      }
      model = result.model;
      inputTokens += result.usage.input_tokens;

      const truthLabels = humanAppliedLabels(labelNames(issue.labels), events);
      const agreement = agreements(truthLabels, result.classification);
      for (const id of QUESTION_IDS) {
        tally(tallies[id], result.classification[id].confidence, agreement[id]);
      }

      logger.log(
        `${prefix} ${result.classification.triage.choice} ` +
          `(${result.classification.triage.confidence.toFixed(2)})`
      );
    }
  };
  await Promise.all(Array.from({ length: EVALUATE_CONCURRENCY }, worker));

  const report = formatEvaluation(tallies, model, inputTokens, issues.length, failures);
  console.log(report);
  appendStepSummary(report);
}

async function listClosedIssuesAsync(limit: number): Promise<TriageIssueWithNumber[]> {
  const issues: TriageIssueWithNumber[] = [];
  const per_page = Math.min(limit, 100);

  for (let page = 1; issues.length < limit; page++) {
    const batch = await listRecentIssuesAsync({ state: 'closed', sort: 'updated', per_page, page });
    if (batch.length === 0) {
      break;
    }
    for (const issue of batch) {
      if (!issue.pull_request && issues.length < limit) {
        issues.push(issue);
      }
    }
  }
  return issues;
}

type TriageIssueWithNumber = TriageIssue & { number: number };

const BUCKETS = ['>=0.9', '0.7-0.9', '<0.7'] as const;
type Bucket = (typeof BUCKETS)[number];
type Counts = { n: number; agree: number };
type Tally = { buckets: Record<Bucket, Counts>; truths: Map<string, Counts> };

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

function formatEvaluation(
  tallies: Record<QuestionId, Tally>,
  model: string,
  inputTokens: number,
  issueCount: number,
  failures: number
): string {
  const lines = [
    `### Jev calibration over ${issueCount} closed issues (${model || 'no model'}, ${failures} failed)`,
    '',
    'Truth comes from labels a person applied. Labels from expo-bot and from the Jev backfill are ignored. Issues without such a label are left out of a question.',
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

  lines.push('', `total input tokens: ${inputTokens}`);
  return lines.join('\n');
}

function row(label: string, counts: Counts): string {
  const percent = counts.n > 0 ? `${((counts.agree / counts.n) * 100).toFixed(1)}%` : '-';
  return `| ${label} | ${counts.n} | ${counts.agree} | ${percent} |`;
}

function parseLimit(value: string | boolean): number {
  if (typeof value !== 'string') {
    return DEFAULT_EVALUATE_LIMIT;
  }
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(
      `Flag \`--evaluate\` was given \`${value}\`, which is not a positive whole number of issues. ` +
        'The command needs a count to know how many closed issues to sample. ' +
        'Pass a number such as `--evaluate 50`, or leave the value out to sample 100 issues.'
    );
  }
  return limit;
}

function requireEnv(name: string, why: string, how: string) {
  if (!process.env[name]) {
    throw new Error(
      `Cannot classify issues because the environment variable \`${name}\` is not set. ${why} ${how}`
    );
  }
}

function appendStepSummary(markdown: string) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, `${markdown}\n\n`);
  }
}
