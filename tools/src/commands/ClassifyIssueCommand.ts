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
  closeBlocker,
  ClassificationResult,
  classifyIssueAsync,
  decideLabels,
  formatReport,
  labelsWithStatus,
  packageOptionsFromLabels,
} from '../IssueTriage';
import {
  EvaluatedIssue,
  formatEvaluation,
  IssueScore,
  scoreIssue,
  summarize,
} from '../IssueTriageEvaluation';
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
    .description(
      'Classifies a GitHub issue with the OpenAI Decisions API and reports the labels it would apply.'
    )
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
  if (options.evaluate && (options.issue || options.tag || options.closeInvalid)) {
    throw new Error(
      'Flag `--evaluate` cannot be combined with `--issue`, `--tag`, or `--close-invalid`. ' +
        '`--evaluate` classifies many closed issues and never adds labels, so the command would ignore those flags. ' +
        'Run `et classify-issue --evaluate [limit]` alone, or `et classify-issue --issue <number>` to classify one issue.'
    );
  }
  requireEnv(
    'GITHUB_TOKEN',
    'The command reads the issue and the repository labels through the GitHub API, which rejects unauthenticated requests.',
    'Export a token with `repo` scope as `GITHUB_TOKEN` and run the command again.'
  );
  requireEnv(
    'OPENAI_API_KEY',
    'The command classifies the issue with the OpenAI Decisions API, which rejects unauthenticated requests.',
    'Create a key at https://platform.openai.com/api-keys and export it as `OPENAI_API_KEY`.'
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

async function classifyOneAsync(issueNumber: number, apply: boolean, closeInvalid: boolean) {
  const [issue, labelNamesInRepo] = await Promise.all([
    getIssueAsync(issueNumber),
    listRepoLabelNamesAsync(),
  ]);
  const result = await classifyIssueAsync(issue, packageOptionsFromLabels(labelNamesInRepo));

  if (apply && issue.state !== 'open') {
    logger.warn(`Issue #${issueNumber} is closed, reporting only.`);
    apply = false;
  }
  const blockedBy = closeBlocker(issue.state, labelNames(issue.labels), issue.author_association);
  if (closeInvalid && blockedBy) {
    logger.warn(`Issue #${issueNumber} is ${blockedBy}, holding back closing labels.`);
  }
  const decisions = decideLabels(result.classification, { closeInvalid, blockedBy });
  const labels = labelsWithStatus(decisions, 'apply');
  if (apply && labels.length > 0) {
    await addIssueLabelsAsync(issueNumber, labels);
  }

  const report = formatReport(issueNumber, result, decisions, { shadow: !apply, closeInvalid });
  console.log(report);
  appendStepSummary(report);
}

type EvaluationOutcome = { result: ClassificationResult; score: IssueScore } | { error: string };

async function evaluateAsync(limit: number) {
  const [labelNamesInRepo, issues] = await Promise.all([
    listRepoLabelNamesAsync(),
    listClosedIssuesAsync(limit),
  ]);
  const packageOptions = packageOptionsFromLabels(labelNamesInRepo);

  const outcomes = await mapConcurrent(
    issues,
    EVALUATE_CONCURRENCY,
    async (issue, index): Promise<EvaluationOutcome> => {
      const prefix = `[${index + 1}/${issues.length}] #${issue.number}`;
      let result;
      let events;
      try {
        [result, events] = await Promise.all([
          classifyIssueAsync(issue, packageOptions),
          listIssueLabelEventsAsync(issue.number),
        ]);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`${prefix} skipped: ${message}`);
        return { error: message };
      }
      const score = scoreIssue(issue, result.classification, events);
      logger.log(
        `${prefix} ${result.classification.triage.choice} ` +
          `(${result.classification.triage.confidence.toFixed(2)})`
      );
      return { result, score };
    }
  );

  const results = outcomes.flatMap((outcome) => ('error' in outcome ? [] : [outcome]));
  const errors = outcomes.flatMap((outcome) => ('error' in outcome ? [outcome.error] : []));
  const report = formatEvaluation(summarize(results.map(({ score }) => score)), {
    model: results[0]?.result.model ?? '',
    inputTokens: results.reduce((sum, { result }) => sum + result.usage.input_tokens, 0),
    issueCount: issues.length,
    failures: errors.length,
  });
  console.log(report);
  appendStepSummary(report);

  if (errors.length > 0) {
    throw new Error(
      `The evaluation could not classify ${errors.length} of ${issues.length} issues, so the numbers above leave them out. ` +
        `The first error was: ${errors[0]} ` +
        'Fix the cause, such as an OpenAI rate limit, and run the evaluation again, or pass a smaller limit.'
    );
  }
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const pending = items.entries();
  const worker = async () => {
    for (const [index, item] of pending) {
      results[index] = await fn(item, index);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function listClosedIssuesAsync(limit: number): Promise<EvaluatedIssue[]> {
  const issues: EvaluatedIssue[] = [];
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
