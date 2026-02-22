import { Command } from '@expo/commander';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import logger from '../Logger';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type ActionOptions = {
  startDate?: string;
  endDate?: string;
  output?: string;
  repo?: string;
};

interface MetricsOptions {
  owner: string;
  repo: string;
  startDate: Date;
  endDate: Date;
}

interface IssueMetrics {
  openAtStart: number;
  openAtEnd: number;
  openedDuringPeriod: number;
  closedDuringPeriod: number;
  netChange: number;
  needsReview: {
    labeledDuringPeriod: number;
    unlabeledDuringPeriod: number;
    closedWithLabel: number;
  };
}

interface PRMetrics {
  openAtStart: number;
  openAtEnd: number;
  openedDuringPeriod: number;
  closedDuringPeriod: number;
  mergedDuringPeriod: number;
  netChange: number;
  external: {
    opened: number;
    closed: number;
    merged: number;
  };
  internal: {
    opened: number;
    closed: number;
    merged: number;
  };
}

interface WorkflowStats {
  name: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  otherRuns: number; // skipped, timed_out, action_required, neutral, stale, in_progress, etc.
  successRate: number;
}

interface CIMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  otherRuns: number; // skipped, timed_out, action_required, neutral, stale, in_progress, etc.
  successRate: number;
  workflows: WorkflowStats[];
}

interface MetricsData {
  issues: IssueMetrics;
  pullRequests: PRMetrics;
  ci: CIMetrics;
}

export default (program: Command) => {
  program
    .command('github-metrics')
    .alias('gm')
    .description('Generate GitHub metrics report for on-call tracking.')
    .option(
      '-s, --start-date <date>',
      'Start date (ISO format YYYY-MM-DD). Defaults to this Monday at 00:00.'
    )
    .option(
      '-e, --end-date <date>',
      'End date (ISO format YYYY-MM-DD). Defaults to now, or end of Friday if past Friday.'
    )
    .option('-o, --output <path>', 'Output file path for the markdown report.')
    .option('-r, --repo <repo>', 'Repository in format owner/repo. Defaults to expo/expo.')
    .asyncAction(action);
};

/**
 * Get the start of this week (Monday at 00:00:00)
 */
function getThisWeekMonday(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days

  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

/**
 * Get the end of this week (Friday at 23:59:59, or now if it's before end of Friday)
 */
function getThisWeekEnd(): Date {
  const now = new Date();
  const monday = getThisWeekMonday();
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4); // Monday + 4 days = Friday
  friday.setHours(23, 59, 59, 999);

  // If current time is before end of Friday, use now instead
  return now < friday ? now : friday;
}

/**
 * Fetch issue metrics for the given time period
 *
 * Design: GitHub doesn't provide snapshot APIs, so we reconstruct snapshots by "time traveling"
 * through issue lifecycles using created_at and closed_at timestamps.
 *
 * Example: To determine if an issue was "open at start" (Monday 00:00):
 * - Issue created before Monday AND (still open OR closed on/after Monday) = was open on Monday
 *
 * Why 30-day buffer: Without it, we'd miss issues created >7 days ago that were still open on Monday.
 * The buffer ensures we fetch enough historical data to accurately reconstruct the state at any point.
 *
 * Same approach is used for PR metrics.
 */
async function fetchIssueMetrics(
  owner: string,
  repo: string,
  startDate: Date,
  endDate: Date
): Promise<IssueMetrics> {
  logger.info(chalk.gray('Fetching issue metrics...'));

  // Fetch all issues (not PRs) created or updated in the date range
  // Note: We use a 30-day buffer before startDate to ensure we capture all issues that were open at the start
  const allIssues = await fetchAllPaginatedData(async (page) => {
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      page,
      since: new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    return data.filter((issue) => !issue.pull_request);
  });

  const openAtStart = allIssues.filter(
    (issue) =>
      new Date(issue.created_at) < startDate &&
      (issue.state === 'open' || (issue.closed_at && new Date(issue.closed_at) >= startDate))
  ).length;

  const openedDuringPeriod = allIssues.filter((issue) => {
    const createdAt = new Date(issue.created_at);
    return createdAt >= startDate && createdAt <= endDate;
  }).length;

  const closedDuringPeriod = allIssues.filter((issue) => {
    if (!issue.closed_at) return false;
    const closedAt = new Date(issue.closed_at);
    return closedAt >= startDate && closedAt <= endDate;
  }).length;

  const openAtEnd = allIssues.filter(
    (issue) =>
      new Date(issue.created_at) <= endDate &&
      (issue.state === 'open' || (issue.closed_at && new Date(issue.closed_at) > endDate))
  ).length;

  const netChange = openedDuringPeriod - closedDuringPeriod;

  // Track "needs review" label metrics
  logger.info(chalk.gray('Tracking "needs review" label...'));

  const hasNeedsReviewLabel = (issue: (typeof allIssues)[0]) => {
    return issue.labels.some(
      (label) => (typeof label === 'string' ? label : label.name) === 'needs review'
    );
  };

  const labeledDuringPeriod = allIssues.filter((issue) => {
    const createdAt = new Date(issue.created_at);
    return createdAt >= startDate && createdAt <= endDate && hasNeedsReviewLabel(issue);
  }).length;

  const closedWithLabel = allIssues.filter((issue) => {
    if (!issue.closed_at) return false;
    const closedAt = new Date(issue.closed_at);
    return closedAt >= startDate && closedAt <= endDate && hasNeedsReviewLabel(issue);
  }).length;

  const unlabeledDuringPeriod = 0;

  return {
    openAtStart,
    openAtEnd,
    openedDuringPeriod,
    closedDuringPeriod,
    netChange,
    needsReview: {
      labeledDuringPeriod,
      unlabeledDuringPeriod,
      closedWithLabel,
    },
  };
}

/**
 * Fetch pull request metrics for the given time period
 *
 * Uses the same "time travel" approach as fetchIssueMetrics - see that function's
 * documentation for design details on how we reconstruct snapshots from timestamps.
 */
async function fetchPRMetrics(
  owner: string,
  repo: string,
  startDate: Date,
  endDate: Date
): Promise<PRMetrics> {
  logger.info(chalk.gray('Fetching pull request metrics...'));

  const allPRs = await fetchAllPaginatedData(async (page) => {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 100,
      page,
      sort: 'updated',
      direction: 'desc',
    });
    return data;
  });

  // Filter to relevant PRs - include PRs that were open at start or active during the period
  // Note: We use a 30-day buffer to capture PRs that might have been closed just before startDate
  const relevantPRs = allPRs.filter((pr) => {
    const createdAt = new Date(pr.created_at);
    const closedAt = pr.closed_at ? new Date(pr.closed_at) : null;

    return (
      createdAt <= endDate &&
      (pr.state === 'open' ||
        !closedAt ||
        closedAt >= new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000))
    );
  });

  const openAtStart = relevantPRs.filter(
    (pr) =>
      new Date(pr.created_at) < startDate &&
      (pr.state === 'open' || (pr.closed_at && new Date(pr.closed_at) >= startDate))
  ).length;

  const openedDuringPeriod = relevantPRs.filter((pr) => {
    const createdAt = new Date(pr.created_at);
    return createdAt >= startDate && createdAt <= endDate;
  }).length;

  const closedDuringPeriod = relevantPRs.filter((pr) => {
    if (!pr.closed_at) return false;
    const closedAt = new Date(pr.closed_at);
    return closedAt >= startDate && closedAt <= endDate;
  }).length;

  const mergedDuringPeriod = relevantPRs.filter((pr) => {
    if (!pr.merged_at) return false;
    const mergedAt = new Date(pr.merged_at);
    return mergedAt >= startDate && mergedAt <= endDate;
  }).length;

  const openAtEnd = relevantPRs.filter(
    (pr) =>
      new Date(pr.created_at) <= endDate &&
      (pr.state === 'open' || (pr.closed_at && new Date(pr.closed_at) > endDate))
  ).length;

  const netChange = openedDuringPeriod - closedDuringPeriod;

  // Split metrics by external vs internal contributions
  logger.info(chalk.gray('Splitting PR metrics by contribution type...'));

  const isExternalContribution = (pr: (typeof relevantPRs)[0]) => {
    return pr.head.repo ? pr.head.repo.full_name !== `${owner}/${repo}` : false;
  };

  const prsOpenedDuringPeriod = relevantPRs.filter((pr) => {
    const createdAt = new Date(pr.created_at);
    return createdAt >= startDate && createdAt <= endDate;
  });

  const prsClosedDuringPeriod = relevantPRs.filter((pr) => {
    if (!pr.closed_at) return false;
    const closedAt = new Date(pr.closed_at);
    return closedAt >= startDate && closedAt <= endDate;
  });

  const prsMergedDuringPeriod = relevantPRs.filter((pr) => {
    if (!pr.merged_at) return false;
    const mergedAt = new Date(pr.merged_at);
    return mergedAt >= startDate && mergedAt <= endDate;
  });

  const externalOpened = prsOpenedDuringPeriod.filter(isExternalContribution).length;
  const externalClosed = prsClosedDuringPeriod.filter(isExternalContribution).length;
  const externalMerged = prsMergedDuringPeriod.filter(isExternalContribution).length;

  const internalOpened = prsOpenedDuringPeriod.length - externalOpened;
  const internalClosed = prsClosedDuringPeriod.length - externalClosed;
  const internalMerged = prsMergedDuringPeriod.length - externalMerged;

  return {
    openAtStart,
    openAtEnd,
    openedDuringPeriod,
    closedDuringPeriod,
    mergedDuringPeriod,
    netChange,
    external: {
      opened: externalOpened,
      closed: externalClosed,
      merged: externalMerged,
    },
    internal: {
      opened: internalOpened,
      closed: internalClosed,
      merged: internalMerged,
    },
  };
}

/**
 * Fetch CI/CD workflow metrics for the given time period
 */
async function fetchCIMetrics(
  owner: string,
  repo: string,
  startDate: Date,
  endDate: Date
): Promise<CIMetrics> {
  logger.info(chalk.gray('Fetching CI metrics...'));

  const workflowRuns = await fetchAllPaginatedData(async (page) => {
    const { data } = await octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: 100,
      page,
      created: `${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}`,
    });
    return data.workflow_runs;
  });

  const totalRuns = workflowRuns.length;
  const successfulRuns = workflowRuns.filter((run) => run.conclusion === 'success').length;
  const failedRuns = workflowRuns.filter((run) => run.conclusion === 'failure').length;
  const cancelledRuns = workflowRuns.filter((run) => run.conclusion === 'cancelled').length;
  const otherRuns = totalRuns - successfulRuns - failedRuns - cancelledRuns;

  const effectiveSuccessfulRuns = successfulRuns + cancelledRuns;
  const successRate = totalRuns > 0 ? (effectiveSuccessfulRuns / totalRuns) * 100 : 0;

  const workflowMap = new Map<string, typeof workflowRuns>();
  for (const run of workflowRuns) {
    const workflowName = run.name ?? 'unknown';
    if (!workflowMap.has(workflowName)) {
      workflowMap.set(workflowName, []);
    }
    workflowMap.get(workflowName)!.push(run);
  }

  const workflows: WorkflowStats[] = Array.from(workflowMap.entries())
    .map(([name, runs]) => {
      const workflowTotalRuns = runs.length;
      const workflowSuccessfulRuns = runs.filter((run) => run.conclusion === 'success').length;
      const workflowFailedRuns = runs.filter((run) => run.conclusion === 'failure').length;
      const workflowCancelledRuns = runs.filter((run) => run.conclusion === 'cancelled').length;
      const workflowOtherRuns =
        workflowTotalRuns - workflowSuccessfulRuns - workflowFailedRuns - workflowCancelledRuns;

      const workflowEffectiveSuccessful = workflowSuccessfulRuns + workflowCancelledRuns;
      const workflowSuccessRate =
        workflowTotalRuns > 0 ? (workflowEffectiveSuccessful / workflowTotalRuns) * 100 : 0;

      return {
        name,
        totalRuns: workflowTotalRuns,
        successfulRuns: workflowSuccessfulRuns,
        failedRuns: workflowFailedRuns,
        cancelledRuns: workflowCancelledRuns,
        otherRuns: workflowOtherRuns,
        successRate: workflowSuccessRate,
      };
    })
    .sort((a, b) => b.totalRuns - a.totalRuns);

  return {
    totalRuns,
    successfulRuns,
    failedRuns,
    cancelledRuns,
    otherRuns,
    successRate,
    workflows,
  };
}

/**
 * Helper function to retry API calls on transient errors
 */
async function retryOnError<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const shouldRetry =
        error.status !== undefined &&
        ((error.status >= 500 && error.status < 600) || error.status === 429);

      if (shouldRetry && attempt < maxRetries) {
        logger.warn(
          chalk.yellow(
            `⚠ API error (${error.status}), retrying in ${delayMs}ms... (attempt ${attempt}/${maxRetries})`
          )
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      } else if (!shouldRetry) {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Helper function to fetch all paginated data
 */
async function fetchAllPaginatedData<T>(fetchPage: (page: number) => Promise<T[]>): Promise<T[]> {
  const allData: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await retryOnError(async () => await fetchPage(page));

    if (data.length === 0) {
      hasMore = false;
    } else {
      allData.push(...data);
      page++;

      if (page > 50) {
        logger.warn(
          chalk.yellow('⚠ Reached pagination limit of 50 pages. Some data may be missing.')
        );
        break;
      }
    }
  }

  return allData;
}

/**
 * Generate a markdown report from the metrics data
 */
function generateMarkdownReport(metrics: MetricsData, options: MetricsOptions): string {
  const { owner, repo, startDate, endDate } = options;
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const report = `# GitHub Metrics Report

**Repository:** ${owner}/${repo}
**Period:** ${startDateStr} to ${endDateStr}
**Generated:** ${new Date().toISOString().split('T')[0]}

---

## 📋 Issues

| Metric | Count |
|--------|-------|
| Open at start of period | ${metrics.issues.openAtStart} |
| Opened during period | ${metrics.issues.openedDuringPeriod} |
| Closed during period | ${metrics.issues.closedDuringPeriod} |
| Open at end of period | ${metrics.issues.openAtEnd} |
| **Net change** | **${metrics.issues.netChange >= 0 ? '+' : ''}${metrics.issues.netChange}** |

### "Needs Review" Label Activity

| Metric | Count |
|--------|-------|
| Issues labeled "needs review" | ${metrics.issues.needsReview.labeledDuringPeriod} |
| Issues unlabeled "needs review" | ${metrics.issues.needsReview.unlabeledDuringPeriod} |
| Issues closed with "needs review" label | ${metrics.issues.needsReview.closedWithLabel} |

## 🔀 Pull Requests

| Metric | Count |
|--------|-------|
| Open at start of period | ${metrics.pullRequests.openAtStart} |
| Opened during period | ${metrics.pullRequests.openedDuringPeriod} |
| Closed during period | ${metrics.pullRequests.closedDuringPeriod} |
| Merged during period | ${metrics.pullRequests.mergedDuringPeriod} |
| Open at end of period | ${metrics.pullRequests.openAtEnd} |
| **Net change** | **${metrics.pullRequests.netChange >= 0 ? '+' : ''}${metrics.pullRequests.netChange}** |

### Community Contributions

| Type | Opened | Closed | Merged |
|------|--------|--------|--------|
| Community (External) | ${metrics.pullRequests.external.opened} | ${metrics.pullRequests.external.closed} | ${metrics.pullRequests.external.merged} |
| Internal | ${metrics.pullRequests.internal.opened} | ${metrics.pullRequests.internal.closed} | ${metrics.pullRequests.internal.merged} |

## ✅ CI/CD Success Rate

| Metric | Count | Percentage |
|--------|-------|------------|
| Total workflow runs | ${metrics.ci.totalRuns} | ${metrics.ci.totalRuns > 0 ? '100%' : 'N/A'} |
| Successful runs | ${metrics.ci.successfulRuns} | ${metrics.ci.totalRuns > 0 ? ((metrics.ci.successfulRuns / metrics.ci.totalRuns) * 100).toFixed(1) : '0.0'}% |
| Failed runs | ${metrics.ci.failedRuns} | ${metrics.ci.totalRuns > 0 ? ((metrics.ci.failedRuns / metrics.ci.totalRuns) * 100).toFixed(1) : '0.0'}% |
| Cancelled runs (concurrency) | ${metrics.ci.cancelledRuns} | ${metrics.ci.totalRuns > 0 ? ((metrics.ci.cancelledRuns / metrics.ci.totalRuns) * 100).toFixed(1) : '0.0'}% |
| Other runs (skipped, in progress, etc.) | ${metrics.ci.otherRuns} | ${metrics.ci.totalRuns > 0 ? ((metrics.ci.otherRuns / metrics.ci.totalRuns) * 100).toFixed(1) : '0.0'}% |
| **Success rate** | **${metrics.ci.successfulRuns + metrics.ci.cancelledRuns}/${metrics.ci.totalRuns}** | **${metrics.ci.successRate.toFixed(1)}%** |

> **Note:** Cancelled runs are counted as successful since they're typically due to concurrency settings (newer runs superseding older ones).

### Workflow Breakdown

| Workflow | Total | Success | Failed | Cancelled | Other | Success Rate |
|----------|-------|---------|--------|-----------|-------|--------------|
${metrics.ci.workflows
  .map(
    (w) =>
      `| ${w.name} | ${w.totalRuns} | ${w.successfulRuns} | ${w.failedRuns} | ${w.cancelledRuns} | ${w.otherRuns} | ${w.successRate.toFixed(1)}% |`
  )
  .join('\n')}

---

## 📊 Summary

- **Issue Health:** ${metrics.issues.netChange <= 0 ? '✅ Issue count decreased' : '⚠️ Issue count increased'}
- **PR Health:** ${metrics.pullRequests.netChange <= 0 ? '✅ PR count decreased' : '⚠️ PR count increased'}
- **CI Health:** ${metrics.ci.successRate >= 90 ? '✅ CI is healthy' : metrics.ci.successRate >= 75 ? '⚠️ CI needs attention' : '❌ CI needs immediate attention'}

### Key Insights

- **Issue velocity:** ${metrics.issues.closedDuringPeriod} issues closed, ${metrics.issues.openedDuringPeriod} new issues opened
- **PR velocity:** ${metrics.pullRequests.mergedDuringPeriod} PRs merged, ${metrics.pullRequests.openedDuringPeriod} new PRs opened
- **CI reliability:** ${metrics.ci.successRate.toFixed(1)}% success rate across ${metrics.ci.totalRuns} workflow runs (${metrics.ci.failedRuns} failures)

---

*This report was generated using the GitHub Metrics tool*
`;

  return report;
}

/**
 * Main function to generate the complete metrics report
 */
async function generateMetricsReport(options: MetricsOptions): Promise<string> {
  const { owner, repo, startDate, endDate } = options;

  try {
    const [issues, pullRequests, ci] = await Promise.all([
      fetchIssueMetrics(owner, repo, startDate, endDate).catch((error) => {
        logger.error(chalk.red('Error fetching issue metrics:'));
        logger.error(chalk.red(`Status: ${error.status || 'N/A'}`));
        logger.error(chalk.red(`Message: ${error.message}`));
        throw error;
      }),
      fetchPRMetrics(owner, repo, startDate, endDate).catch((error) => {
        logger.error(chalk.red('Error fetching PR metrics:'));
        logger.error(chalk.red(`Status: ${error.status || 'N/A'}`));
        logger.error(chalk.red(`Message: ${error.message}`));
        throw error;
      }),
      fetchCIMetrics(owner, repo, startDate, endDate).catch((error) => {
        logger.error(chalk.red('Error fetching CI metrics:'));
        logger.error(chalk.red(`Status: ${error.status || 'N/A'}`));
        logger.error(chalk.red(`Message: ${error.message}`));
        throw error;
      }),
    ]);

    const metrics: MetricsData = {
      issues,
      pullRequests,
      ci,
    };

    logger.info(chalk.green('✓ Metrics collected successfully\n'));

    return generateMarkdownReport(metrics, options);
  } catch (error: any) {
    logger.error(chalk.red('\n🔥 Failed to generate metrics report'));
    throw error;
  }
}

async function action(options: ActionOptions) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(
      'Environment variable `GITHUB_TOKEN` is required for this command.\n' +
        'Create a token at: https://github.com/settings/tokens/new?description=expotools-github&scopes=public_repo'
    );
  }

  try {
    logger.info(chalk.bold('📊 Generating GitHub metrics report...\n'));

    const endDate = options.endDate ? new Date(options.endDate) : getThisWeekEnd();
    const startDate = options.startDate ? new Date(options.startDate) : getThisWeekMonday();

    if (isNaN(startDate.getTime())) {
      throw new Error(`Invalid start date: ${options.startDate}`);
    }

    if (isNaN(endDate.getTime())) {
      throw new Error(`Invalid end date: ${options.endDate}`);
    }

    if (startDate >= endDate) {
      throw new Error('Start date must be before end date.');
    }

    const [owner, repo] = (options.repo || 'expo/expo').split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository format. Use owner/repo format.');
    }

    logger.info(`Repository: ${chalk.cyan(`${owner}/${repo}`)}`);
    logger.info(
      `Date range: ${chalk.cyan(startDate.toISOString().split('T')[0])} to ${chalk.cyan(endDate.toISOString().split('T')[0])}\n`
    );

    const report = await generateMetricsReport({
      owner,
      repo,
      startDate,
      endDate,
    });

    if (options.output) {
      const outputPath = path.resolve(options.output);
      await fs.writeFile(outputPath, report);
      logger.info(chalk.green(`✓ Report saved to: ${outputPath}`));
    } else {
      logger.info(chalk.bold('📄 Metrics Report:\n'));
      console.log(report);
    }
  } catch (error: any) {
    logger.error(chalk.red('\n❌ Error Details:'));
    logger.error(chalk.red(`Message: ${error.message}`));

    if (error.status) {
      logger.error(chalk.red(`HTTP Status: ${error.status}`));
    }

    if (error.response) {
      logger.error(chalk.red('Response:'));
      logger.error(chalk.red(JSON.stringify(error.response, null, 2)));
    }

    if (error.request) {
      logger.error(chalk.red('Request:'));
      logger.error(chalk.red(`URL: ${error.request?.url || 'N/A'}`));
      logger.error(chalk.red(`Method: ${error.request?.method || 'N/A'}`));
    }

    if (error.stack) {
      logger.error(chalk.gray('\nStack trace:'));
      logger.error(chalk.gray(error.stack));
    }

    throw error;
  }
}
