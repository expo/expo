import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import Table from 'cli-table3';
import { glob } from 'glob';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import { getAuthenticatedUserAsync } from '../GitHub';
import {
  downloadJobLogsAsync,
  getJobsForWorkflowRunAsync,
  getWorkflowRunsForRepoAsync,
} from '../GitHubActions';
import logger from '../Logger';

type ActionOptions = {
  branch: string;
  week?: string;
  inspect?: string;
};

type AuthStatus = {
  github: boolean;
  githubUser: string | null;
  eas: boolean;
  easUser: string | null;
};

/**
 * Get the ISO week number for a date.
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get the Monday at 00:00:00 for a given ISO week number and year.
 */
function getMondayOfWeek(week: number, year: number): Date {
  // Jan 4 is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 1=Mon..7=Sun
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (dayOfWeek - 1));
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Parse --week flag. Accepts a week number (e.g. "5") or "last"/"prev" for previous week.
 * Returns [startDate, endDate, weekNumber].
 */
function parseDateRange(weekOption?: string): [Date, Date, number] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = getISOWeekNumber(now);

  let targetWeek: number;
  if (!weekOption) {
    targetWeek = currentWeek;
  } else if (weekOption === 'last' || weekOption === 'prev') {
    targetWeek = currentWeek - 1;
  } else {
    targetWeek = parseInt(weekOption, 10);
    if (isNaN(targetWeek) || targetWeek < 1 || targetWeek > 53) {
      logger.error(`Invalid week number: ${weekOption}. Use 1-53, "last", or "prev".`);
      process.exit(1);
    }
  }

  const monday = getMondayOfWeek(targetWeek, currentYear);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  // For past weeks, always use Friday EOD. For current/future, cap at now.
  const endDate = friday < now ? friday : now;

  return [monday, endDate, targetWeek];
}

function conclusionColor(conclusion: string | null, status: string): string {
  if (status === 'in_progress' || status === 'queued') {
    return chalk.yellow(status);
  }
  if (conclusion === 'success') {
    return chalk.green('success');
  }
  if (conclusion === 'failure') {
    return chalk.red('failure');
  }
  if (conclusion === 'cancelled') {
    return chalk.gray('cancelled');
  }
  return chalk.gray(conclusion ?? status);
}

function easStatusColor(status: string): string {
  switch (status) {
    case 'FAILURE':
    case 'ERRORED':
      return chalk.red(status);
    case 'IN_PROGRESS':
    case 'PENDING':
      return chalk.yellow(status);
    case 'SUCCESS':
    case 'FINISHED':
      return chalk.green(status);
    case 'CANCELED':
      return chalk.gray(status);
    default:
      return chalk.gray(status);
  }
}

interface WorkflowStats {
  name: string;
  total: number;
  success: number;
  failed: number;
  cancelled: number;
  other: number;
  successRate: number;
}

interface DailyRate {
  label: string; // Mon, Tue, etc.
  date: string; // YYYY-MM-DD
  total: number;
  successful: number;
}

interface SectionResult {
  source: string;
  totalRuns: number;
  successRate: number;
  failedRuns: number;
  workflows: WorkflowStats[];
  dailyRates: DailyRate[];
}

/**
 * Compute per-day success rates from a list of runs.
 * Each run must have a date field and a conclusion/status field.
 * Returns an entry for each day Mon-Fri within the date range.
 */
function computeDailyRates(
  runs: any[],
  startDate: Date,
  getTimestamp: (run: any) => string | undefined,
  isSuccess: (run: any) => boolean,
  isConcluded: (run: any) => boolean
): DailyRate[] {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const monday = new Date(startDate);
  monday.setHours(0, 0, 0, 0);

  const dailyRates: DailyRate[] = [];

  for (let i = 0; i < 5; i++) {
    const dayStart = new Date(monday);
    dayStart.setDate(monday.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayRuns = runs.filter((r) => {
      const ts = getTimestamp(r);
      if (!ts) return false;
      const d = new Date(ts);
      return d >= dayStart && d <= dayEnd;
    });

    // Only count concluded runs for rate calculation
    const concluded = dayRuns.filter(isConcluded);
    const successful = concluded.filter(isSuccess);

    dailyRates.push({
      label: dayNames[i],
      date: dayStart.toISOString().split('T')[0],
      total: concluded.length,
      successful: successful.length,
    });
  }

  return dailyRates;
}

/**
 * Count run stats from a list of runs using a classifier function.
 * The classifier maps a run to one of: 'success', 'failure', 'cancelled', or 'other'.
 */
function countRunStats(
  runs: any[],
  classify: (run: any) => 'success' | 'failure' | 'cancelled' | 'other'
): {
  total: number;
  success: number;
  failed: number;
  cancelled: number;
  other: number;
  successRate: number;
} {
  let success = 0,
    failed = 0,
    cancelled = 0,
    other = 0;
  for (const run of runs) {
    const c = classify(run);
    if (c === 'success') success++;
    else if (c === 'failure') failed++;
    else if (c === 'cancelled') cancelled++;
    else other++;
  }
  const total = runs.length;
  const effective = success + cancelled;
  const successRate = total > 0 ? (effective / total) * 100 : 0;
  return { total, success, failed, cancelled, other, successRate };
}

/** Classify a GitHub Actions run. */
function classifyGitHubRun(run: any): 'success' | 'failure' | 'cancelled' | 'other' {
  if (run.conclusion === 'success') return 'success';
  if (run.conclusion === 'failure') return 'failure';
  if (run.conclusion === 'cancelled') return 'cancelled';
  return 'other';
}

/** Classify an EAS workflow run. */
function classifyEASRun(run: any): 'success' | 'failure' | 'cancelled' | 'other' {
  const status = (run.status ?? '').toUpperCase();
  if (status === 'SUCCESS' || status === 'FINISHED') return 'success';
  if (status === 'FAILURE' || status === 'ERRORED') return 'failure';
  if (status === 'CANCELED') return 'cancelled';
  return 'other';
}

/**
 * Build a workflow breakdown table and return per-workflow stats.
 * Groups runs by name using the provided getName function,
 * classifies each run, and prints the table.
 */
function buildWorkflowBreakdown(
  runs: any[],
  getName: (run: any) => string,
  classify: (run: any) => 'success' | 'failure' | 'cancelled' | 'other'
): WorkflowStats[] {
  const workflowMap = new Map<string, any[]>();
  for (const run of runs) {
    const name = getName(run);
    if (!workflowMap.has(name)) {
      workflowMap.set(name, []);
    }
    workflowMap.get(name)!.push(run);
  }

  const table = new Table({
    head: ['Workflow', 'Total', 'Success', 'Failed', 'Cancelled', 'Other', 'Success Rate'],
    style: { head: ['cyan'] },
  });

  const sorted = [...workflowMap.entries()].sort((a, b) => b[1].length - a[1].length);
  const stats: WorkflowStats[] = [];

  for (const [name, wfRuns] of sorted) {
    const s = countRunStats(wfRuns, classify);
    stats.push({ name, ...s });
    table.push([
      name,
      String(s.total),
      String(s.success),
      s.failed > 0 ? chalk.red(String(s.failed)) : '0',
      String(s.cancelled),
      String(s.other),
      successRateColor(s.successRate),
    ]);
  }

  logger.log(table.toString());
  logger.log('');

  return stats;
}

function successRateColor(rate: number): string {
  const pct = `${rate.toFixed(1)}%`;
  if (rate >= 90) return chalk.green(pct);
  if (rate >= 75) return chalk.yellow(pct);
  return chalk.red(pct);
}

async function printGitHubActionsStatus(
  branch: string,
  startDate: Date,
  endDate: Date
): Promise<SectionResult | null> {
  logger.info(`\n${chalk.bold('GitHub Actions')} (branch: ${branch})\n`);

  logger.info(chalk.gray('Fetching workflow runs from GitHub Actions...'));

  let runs;
  try {
    runs = await getWorkflowRunsForRepoAsync(branch, { startDate, endDate });
  } catch (error: any) {
    logger.error(`Failed to fetch GitHub Actions runs: ${error.message}`);
    logger.warn('Make sure GITHUB_TOKEN is set in your environment.');
    return null;
  }

  logger.info(chalk.gray(`Fetched ${runs.length} runs, processing...`));

  if (!runs.length) {
    logger.log('No workflow runs found.');
    return null;
  }

  // --- Latest run per workflow (current status) ---
  const latestByWorkflow = new Map<string, (typeof runs)[0]>();
  for (const run of runs) {
    if (!latestByWorkflow.has(run.name!)) {
      latestByWorkflow.set(run.name!, run);
    }
  }

  const sortedLatest = [...latestByWorkflow.values()].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  );

  const statusTable = new Table({
    head: ['Workflow', 'Status', 'URL'],
    style: { head: ['cyan'] },
  });

  let failing = 0;
  let inProgress = 0;
  let passing = 0;

  for (const run of sortedLatest) {
    const status = conclusionColor(run.conclusion, run.status!);
    statusTable.push([run.name ?? 'unknown', status, run.html_url]);

    if (run.conclusion === 'failure') {
      failing++;
    } else if (run.status === 'in_progress' || run.status === 'queued') {
      inProgress++;
    } else if (run.conclusion === 'success') {
      passing++;
    }
  }

  logger.log(statusTable.toString());
  logger.log(
    `\n  ${chalk.red(`${failing} failing`)}, ${chalk.yellow(`${inProgress} in progress`)}, ${chalk.green(`${passing} passing`)}\n`
  );

  // --- Workflow breakdown (matching github-metrics CI output) ---
  logger.info(chalk.gray('Computing workflow breakdown...\n'));

  const overall = countRunStats(runs, classifyGitHubRun);

  logger.info(`  ${chalk.bold('CI/CD Success Rate')}\n`);
  logger.log(`  Total workflow runs: ${overall.total}`);
  logger.log(`  Successful:  ${chalk.green(String(overall.success))}`);
  logger.log(`  Failed:      ${chalk.red(String(overall.failed))}`);
  logger.log(`  Cancelled:   ${chalk.gray(String(overall.cancelled))}`);
  logger.log(`  Other:       ${chalk.gray(String(overall.other))}`);
  logger.log(
    `  Success rate: ${successRateColor(overall.successRate)} (cancelled counted as success)\n`
  );

  const workflowStats = buildWorkflowBreakdown(runs, (r) => r.name ?? 'unknown', classifyGitHubRun);

  // Compute daily rates for trend
  const dailyRates = computeDailyRates(
    runs,
    startDate,
    (r) => r.created_at ?? r.run_started_at,
    (r) => {
      const c = classifyGitHubRun(r);
      return c === 'success' || c === 'cancelled';
    },
    (r) => classifyGitHubRun(r) !== 'other'
  );

  return {
    source: 'GitHub Actions',
    totalRuns: overall.total,
    successRate: overall.successRate,
    failedRuns: overall.failed,
    workflows: workflowStats,
    dailyRates,
  };
}

async function findEASProjectDirs(): Promise<string[]> {
  const pattern = 'apps/*/.eas/workflows';
  const matches = await glob(pattern, { cwd: EXPO_DIR });
  return matches.map((match) => path.resolve(EXPO_DIR, path.dirname(path.dirname(match))));
}

/**
 * Fetches workflow runs from EAS CLI for a given project.
 *
 * **Limitation:** The EAS CLI (`eas workflow:runs`) returns at most 100 runs across ALL
 * workflows in the project, with no server-side date filtering. This means:
 * - For projects with many workflows or frequent runs, older runs fall off the window.
 * - When using `--week` to inspect past weeks, failures may no longer be visible if they've
 *   been pushed out by newer runs.
 * - Unlike GitHub Actions (which supports server-side `created` date filtering with pagination),
 *   EAS date filtering is done client-side after fetching the capped result set.
 */
async function fetchEASRuns(
  projectDir: string,
  projectName: string,
  env: Record<string, string | undefined>
): Promise<any[]> {
  let output: string;
  try {
    const result = await spawnAsync('eas', ['workflow:runs', '--json', '--limit', '100'], {
      cwd: projectDir,
      env,
    });
    output = result.stdout;
  } catch (error: any) {
    const stderr = error.stderr?.trim();
    logger.warn(
      `Failed to fetch Expo Workflow runs for ${projectName}: ${stderr || error.message}`
    );
    return [];
  }

  try {
    const runs = JSON.parse(output);
    return Array.isArray(runs) ? runs : [];
  } catch {
    logger.warn(`Failed to parse EAS CLI output for ${projectName}.`);
    return [];
  }
}

async function printExpoWorkflowsStatus(startDate: Date, endDate: Date): Promise<SectionResult[]> {
  logger.info(`\n${chalk.bold('Expo Workflows')}\n`);

  logger.info(chalk.gray('Discovering EAS projects...'));

  let projectDirs: string[];
  try {
    projectDirs = await findEASProjectDirs();
  } catch (error: any) {
    logger.warn(`Failed to discover EAS projects: ${error.message}`);
    return [];
  }

  if (!projectDirs.length) {
    logger.log('No EAS workflow projects found under apps/.');
    return [];
  }

  logger.info(chalk.gray(`Found ${projectDirs.length} project(s) with workflows`));

  const easEnv = {
    ...process.env,
    EXPO_NO_DOCTOR: 'true',
    EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE ?? 'release-client',
  };

  // --- Failures table ---
  const failuresTable = new Table({
    head: ['Project', 'Workflow', 'Status', 'Run ID'],
    style: { head: ['cyan'] },
  });

  let hasFailures = false;
  const allProjectRuns: { project: string; runs: any[] }[] = [];

  for (const projectDir of projectDirs) {
    const projectName = path.basename(projectDir);

    // Fetch all runs for the breakdown
    logger.info(chalk.gray(`Fetching workflow runs for ${projectName}...`));
    const allRuns = await fetchEASRuns(projectDir, projectName, easEnv);

    // Filter to date range
    const runsInRange = allRuns.filter((r) => {
      const ts = r.startedAt ?? r.createdAt ?? r.created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return d >= startDate && d <= endDate;
    });

    if (runsInRange.length) {
      allProjectRuns.push({ project: projectName, runs: runsInRange });
    }

    // Latest failure per workflow for the failures table
    const failedRuns = runsInRange.filter((r) => (r.status ?? '').toUpperCase() === 'FAILURE');

    if (failedRuns.length) {
      hasFailures = true;
      const latestByWorkflow = new Map<string, any>();
      for (const run of failedRuns) {
        const name = run.workflowName ?? run.workflow_name ?? 'unknown';
        if (!latestByWorkflow.has(name)) {
          latestByWorkflow.set(name, run);
        }
      }
      for (const [workflowName, run] of [...latestByWorkflow.entries()].sort((a, b) =>
        a[0].localeCompare(b[0])
      )) {
        failuresTable.push([
          projectName,
          workflowName,
          easStatusColor(run.status ?? 'UNKNOWN'),
          run.id ?? '',
        ]);
      }
    }
  }

  if (hasFailures) {
    logger.log(failuresTable.toString());
  } else {
    logger.log('No failing Expo Workflow runs found.');
  }

  // --- Workflow breakdown (matching github-metrics style) ---
  const results: SectionResult[] = [];

  if (allProjectRuns.length > 0) {
    logger.info(chalk.gray('\nComputing workflow breakdown...\n'));

    for (const { project, runs } of allProjectRuns) {
      const overall = countRunStats(runs, classifyEASRun);

      logger.info(`  ${chalk.bold(`${project} — CI/CD Success Rate`)}\n`);
      logger.log(`  Total workflow runs: ${overall.total}`);
      logger.log(`  Successful:  ${chalk.green(String(overall.success))}`);
      logger.log(`  Failed:      ${chalk.red(String(overall.failed))}`);
      logger.log(`  Cancelled:   ${chalk.gray(String(overall.cancelled))}`);
      logger.log(`  Other:       ${chalk.gray(String(overall.other))}`);
      logger.log(
        `  Success rate: ${successRateColor(overall.successRate)} (cancelled counted as success)\n`
      );

      const workflowStats = buildWorkflowBreakdown(
        runs,
        (r) => r.workflowName ?? r.workflow_name ?? 'unknown',
        classifyEASRun
      );

      // Compute daily rates for trend
      const dailyRates = computeDailyRates(
        runs,
        startDate,
        (r) => r.startedAt ?? r.createdAt ?? r.created_at,
        (r) => {
          const c = classifyEASRun(r);
          return c === 'success' || c === 'cancelled';
        },
        (r) => classifyEASRun(r) !== 'other'
      );

      results.push({
        source: `EAS: ${project}`,
        totalRuns: overall.total,
        successRate: overall.successRate,
        failedRuns: overall.failed,
        workflows: workflowStats,
        dailyRates,
      });
    }
  }

  return results;
}

function printWeekTrend(results: SectionResult[]): void {
  logger.log('─'.repeat(40));
  logger.info(`\n${chalk.bold('Week Trend')}\n`);

  // Merge daily rates across all sections
  const mergedDays = new Map<string, { label: string; total: number; successful: number }>();

  for (const result of results) {
    for (const day of result.dailyRates) {
      const existing = mergedDays.get(day.date) ?? { label: day.label, total: 0, successful: 0 };
      existing.total += day.total;
      existing.successful += day.successful;
      mergedDays.set(day.date, existing);
    }
  }

  const sortedDays = [...mergedDays.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const barWidth = 15;
  let prevRate: number | null = null;
  const rates: number[] = [];

  for (const [, day] of sortedDays) {
    const rate = day.total > 0 ? (day.successful / day.total) * 100 : -1;

    if (rate < 0) {
      // No data for this day
      logger.log(`  ${chalk.gray(day.label)}  ${chalk.gray('—  no data')}`);
      continue;
    }

    rates.push(rate);

    const filled = Math.round((rate / 100) * barWidth);
    const barColor = rate >= 90 ? chalk.green : rate >= 75 ? chalk.yellow : chalk.red;
    const bar = barColor('█'.repeat(filled)) + chalk.gray('░'.repeat(barWidth - filled));

    let trend = '  ';
    if (prevRate !== null) {
      const diff = rate - prevRate;
      if (diff > 2) {
        trend = chalk.green('↑');
      } else if (diff < -2) {
        trend = chalk.red('↓');
      } else {
        trend = chalk.gray('→');
      }
    }

    const rateStr = successRateColor(rate);

    logger.log(
      `  ${day.label}  ${bar}  ${rateStr}  ${trend}  ${chalk.gray(`(${day.total} runs)`)}`
    );
    prevRate = rate;
  }

  // Overall trend line
  if (rates.length >= 2) {
    const first = rates[0];
    const last = rates[rates.length - 1];
    const diff = last - first;
    const sign = diff >= 0 ? '+' : '';
    const trendColor = diff > 2 ? chalk.green : diff < -2 ? chalk.red : chalk.gray;
    const trendLabel = diff > 2 ? 'Improving' : diff < -2 ? 'Declining' : 'Stable';
    logger.log(
      `\n  ${trendColor(`${trendLabel} (${sign}${diff.toFixed(1)}% from ${sortedDays[0][1].label} to ${sortedDays[sortedDays.length - 1][1].label})`)}`
    );
  }

  logger.log('');
}

async function checkAuth(): Promise<AuthStatus> {
  const status: AuthStatus = { github: false, githubUser: null, eas: false, easUser: null };

  logger.info(chalk.gray('Checking GitHub authentication...'));
  if (process.env.GITHUB_TOKEN) {
    try {
      const user = await getAuthenticatedUserAsync();
      status.github = true;
      status.githubUser = user.login;
    } catch {
      // Token exists but is invalid
    }
  }

  logger.info(chalk.gray('Checking EAS authentication...'));
  try {
    const result = await spawnAsync('eas', ['whoami'], {
      env: { ...process.env, EXPO_NO_DOCTOR: 'true' },
    });
    const firstLine = result.stdout.trim().split('\n')[0].trim();
    if (firstLine) {
      status.eas = true;
      status.easUser = firstLine;
    }
  } catch {
    // Not logged in or eas not installed
  }

  return status;
}

function printAuthStatus(auth: AuthStatus): void {
  const gh = auth.github
    ? `${chalk.green('✓')} ${auth.githubUser}`
    : `${chalk.red('✗')} not authenticated — run ${chalk.cyan('export GITHUB_TOKEN="$(gh auth token)"')}`;
  const eas = auth.eas
    ? `${chalk.green('✓')} ${auth.easUser}`
    : `${chalk.red('✗')} not authenticated — run ${chalk.cyan('eas login')}`;
  logger.log(`  GitHub: ${gh}  |  EAS: ${eas}\n`);
}

/**
 * Extract the most relevant error lines from a job log.
 * Looks for common error patterns and returns surrounding context.
 */
function extractErrorSnippets(log: string, maxLines: number = 80): string[] {
  const lines = log.split('\n');
  const snippets: string[] = [];

  // Patterns that indicate error regions in GitHub Actions logs
  const errorPatterns = [
    /##\[error\]/i,
    /Error:/i,
    /FAIL /,
    /FAILED/,
    /error\[/i,
    /panic:/i,
    /Exception:/i,
    /AssertionError/i,
    /TypeError:/i,
    /ReferenceError:/i,
    /SyntaxError:/i,
    /Build failed/i,
    /Process completed with exit code [^0]/,
    /Command failed/i,
    /fatal:/i,
  ];

  // Find lines matching error patterns and grab context around them
  const errorLineIndices = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of errorPatterns) {
      if (pattern.test(lines[i])) {
        // Add surrounding context (5 lines before, 10 after)
        for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 10); j++) {
          errorLineIndices.add(j);
        }
        break;
      }
    }
  }

  if (errorLineIndices.size > 0) {
    // Group consecutive lines into snippets
    const sorted = [...errorLineIndices].sort((a, b) => a - b);
    let currentSnippet: string[] = [];
    let lastIdx = -2;

    for (const idx of sorted) {
      if (idx !== lastIdx + 1 && currentSnippet.length > 0) {
        snippets.push(currentSnippet.join('\n'));
        currentSnippet = [];
      }
      currentSnippet.push(lines[idx]);
      lastIdx = idx;
    }
    if (currentSnippet.length > 0) {
      snippets.push(currentSnippet.join('\n'));
    }
  }

  // If no error patterns found, return the last N lines (tail of log)
  if (snippets.length === 0) {
    const tail = lines.slice(-maxLines).join('\n');
    if (tail.trim()) {
      snippets.push(tail);
    }
  }

  // Truncate total output to maxLines
  const joined = snippets.join('\n...\n');
  const joinedLines = joined.split('\n');
  if (joinedLines.length > maxLines) {
    return [joinedLines.slice(0, maxLines).join('\n') + '\n... (truncated)'];
  }
  return snippets;
}

/**
 * Strip ANSI timestamp prefixes from GitHub Actions log lines.
 * Lines typically look like: "2024-01-15T10:30:45.1234567Z actual content"
 */
function stripLogTimestamps(log: string): string {
  return log.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z /gm, '');
}

/**
 * Print log snippets in a bordered box.
 */
function printLogSnippets(snippets: string[]): void {
  logger.log(`\n    ${chalk.bold('Error output:')}`);
  logger.log('    ┌' + '─'.repeat(70));
  for (let si = 0; si < snippets.length; si++) {
    const indented = snippets[si]
      .split('\n')
      .map((line) => `    │ ${line}`)
      .join('\n');
    logger.log(indented);
    if (si < snippets.length - 1) {
      logger.log('    │ ...');
    }
  }
  logger.log('    └' + '─'.repeat(70));
}

/**
 * Print a failure pattern summary based on timestamps.
 */
function printFailurePatternSummary(
  failedRuns: { timestamp: Date }[],
  startDate: Date,
  endDate: Date
): void {
  if (failedRuns.length <= 1) return;

  logger.log('─'.repeat(40));
  logger.info(`\n${chalk.bold('Failure Pattern Summary')}\n`);
  logger.log(`  ${failedRuns.length} failures in the date range.`);

  const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
  const recentCount = failedRuns.filter((r) => r.timestamp > midpoint).length;
  const earlyCount = failedRuns.length - recentCount;

  if (recentCount > earlyCount * 2) {
    logger.log(
      `  ${chalk.red('→')} Failures are ${chalk.red('increasing')} — most failures occurred in the second half of the period.`
    );
  } else if (earlyCount > recentCount * 2) {
    logger.log(
      `  ${chalk.green('→')} Failures are ${chalk.green('decreasing')} — most failures occurred in the first half of the period.`
    );
  } else {
    logger.log(
      `  ${chalk.yellow('→')} Failures are ${chalk.yellow('spread evenly')} across the period.`
    );
  }
  logger.log('');
}

/**
 * Inspect a GitHub Actions workflow by name.
 * Returns true if a matching workflow was found (even if no failures).
 */
async function inspectGitHubWorkflow(
  workflowName: string,
  branch: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  logger.info(chalk.gray('Fetching GitHub Actions workflow runs...'));

  let runs;
  try {
    runs = await getWorkflowRunsForRepoAsync(branch, { startDate, endDate });
  } catch (error: any) {
    logger.error(`Failed to fetch GitHub Actions runs: ${error.message}`);
    return false;
  }

  // Filter to matching workflow name (case-insensitive partial match)
  const needle = workflowName.toLowerCase();
  const matchingRuns = runs.filter((r: any) => (r.name ?? '').toLowerCase().includes(needle));

  if (!matchingRuns.length) {
    return false;
  }

  // Get the actual workflow name from the first match
  const actualName = matchingRuns[0].name;
  const workflowRuns = matchingRuns.filter((r: any) => r.name === actualName);

  logger.info(`${chalk.gray('Source:')} GitHub Actions\n`);

  // Summarize all runs for this workflow
  const failed = workflowRuns.filter((r: any) => r.conclusion === 'failure');
  const succeeded = workflowRuns.filter((r: any) => r.conclusion === 'success');
  const cancelled = workflowRuns.filter((r: any) => r.conclusion === 'cancelled');

  logger.log(`  Workflow: ${chalk.bold(actualName)}`);
  logger.log(`  Total runs: ${workflowRuns.length}`);
  logger.log(
    `  ${chalk.green(`${succeeded.length} passed`)}, ${chalk.red(`${failed.length} failed`)}, ${chalk.gray(`${cancelled.length} cancelled`)}\n`
  );

  if (!failed.length) {
    logger.info(chalk.green('No failures found for this workflow.'));
    return true;
  }

  // Inspect up to 3 most recent failures
  const recentFailures = failed.slice(0, 3);
  logger.info(chalk.gray(`Inspecting ${recentFailures.length} most recent failure(s)...\n`));

  for (const run of recentFailures) {
    const runDate = new Date(run.created_at).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    logger.log('─'.repeat(40));
    logger.log(`\n  ${chalk.bold(`Run #${run.run_number}`)} — ${runDate}`);
    logger.log(`  ${chalk.gray(run.html_url)}`);

    if (run.head_commit?.message) {
      const commitMsg = run.head_commit.message.split('\n')[0];
      logger.log(`  Commit: ${chalk.gray(commitMsg)}`);
    }

    // Fetch jobs for this run
    logger.info(chalk.gray(`  Fetching jobs for run #${run.run_number}...`));

    let jobs;
    try {
      jobs = await getJobsForWorkflowRunAsync(run.id);
    } catch (error: any) {
      logger.warn(`  Failed to fetch jobs: ${error.message}`);
      continue;
    }

    const failedJobs = jobs.filter((j) => j.conclusion === 'failure');
    if (!failedJobs.length) {
      logger.log(`  ${chalk.gray('No failed jobs found (run may have been cancelled).')}`);
      continue;
    }

    logger.log(`  ${chalk.red(`${failedJobs.length} failed job(s)`)}:\n`);

    for (const job of failedJobs) {
      logger.log(`  ${chalk.red('✗')} ${chalk.bold(job.name)}`);

      // Show failed steps
      const failedSteps = (job.steps ?? []).filter((s) => s.conclusion === 'failure');
      if (failedSteps.length) {
        for (const step of failedSteps) {
          logger.log(`    Step: ${chalk.red(step.name)}`);
        }
      }

      // Download and extract log
      logger.info(chalk.gray(`    Downloading log for "${job.name}"...`));

      const rawLog = await downloadJobLogsAsync(job.id);
      if (!rawLog) {
        logger.warn(`    Could not download log for this job.`);
        continue;
      }

      const log = stripLogTimestamps(rawLog);
      const snippets = extractErrorSnippets(log);
      if (snippets.length) {
        printLogSnippets(snippets);
      }

      logger.log('');
    }
  }

  printFailurePatternSummary(
    failed.map((r: any) => ({ timestamp: new Date(r.created_at) })),
    startDate,
    endDate
  );

  return true;
}

/**
 * Run an EAS CLI command and return parsed JSON, or null on failure.
 */
async function runEASCommand(
  args: string[],
  projectDir: string,
  env: Record<string, string | undefined>
): Promise<any | null> {
  try {
    const result = await spawnAsync('eas', args, { cwd: projectDir, env });
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

/**
 * Inspect an Expo Workflow by name across discovered EAS projects.
 * Returns true if a matching workflow was found.
 *
 * Note: This relies on `fetchEASRuns` which is capped at 100 most recent runs per project.
 * If the failure you're looking for has been pushed out of that window by newer runs,
 * it won't appear here. For older failures, check the EAS dashboard directly.
 */
async function inspectEASWorkflow(
  workflowName: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  logger.info(chalk.gray('Searching Expo Workflows...'));

  let projectDirs: string[];
  try {
    projectDirs = await findEASProjectDirs();
  } catch {
    return false;
  }

  if (!projectDirs.length) return false;

  const easEnv = {
    ...process.env,
    EXPO_NO_DOCTOR: 'true',
    EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE ?? 'release-client',
  };

  const needle = workflowName.toLowerCase();

  for (const projectDir of projectDirs) {
    const projectName = path.basename(projectDir);

    // Fetch all runs and find matching workflow name
    logger.info(chalk.gray(`Fetching runs for ${projectName}...`));
    const allRuns = await fetchEASRuns(projectDir, projectName, easEnv);

    // Filter to date range
    const runsInRange = allRuns.filter((r) => {
      const ts = r.startedAt ?? r.createdAt ?? r.created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return d >= startDate && d <= endDate;
    });

    // Find matching workflow name
    const matchingRuns = runsInRange.filter((r) =>
      (r.workflowName ?? r.workflow_name ?? '').toLowerCase().includes(needle)
    );

    if (!matchingRuns.length) continue;

    // Get the actual workflow name from the first match
    const actualName = matchingRuns[0].workflowName ?? matchingRuns[0].workflow_name;
    const workflowRuns = matchingRuns.filter(
      (r) => (r.workflowName ?? r.workflow_name) === actualName
    );

    logger.info(`${chalk.gray('Source:')} Expo Workflows (${projectName})\n`);

    // Summarize
    const failed = workflowRuns.filter((r) => (r.status ?? '').toUpperCase() === 'FAILURE');
    const succeeded = workflowRuns.filter((r) => {
      const s = (r.status ?? '').toUpperCase();
      return s === 'SUCCESS' || s === 'FINISHED';
    });
    const cancelled = workflowRuns.filter((r) => (r.status ?? '').toUpperCase() === 'CANCELED');

    logger.log(`  Workflow: ${chalk.bold(actualName)}`);
    logger.log(`  Project: ${projectName}`);
    logger.log(`  Total runs: ${workflowRuns.length}`);
    logger.log(
      `  ${chalk.green(`${succeeded.length} passed`)}, ${chalk.red(`${failed.length} failed`)}, ${chalk.gray(`${cancelled.length} cancelled`)}\n`
    );

    if (!failed.length) {
      logger.info(chalk.green('No failures found for this workflow.'));
      return true;
    }

    // Inspect up to 3 most recent failures
    const recentFailures = failed.slice(0, 3);
    logger.info(chalk.gray(`Inspecting ${recentFailures.length} most recent failure(s)...\n`));

    for (const run of recentFailures) {
      const ts = run.startedAt ?? run.createdAt;
      const runDate = ts
        ? new Date(ts).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'unknown date';

      logger.log('─'.repeat(40));
      logger.log(`\n  ${chalk.bold(`Run ${run.id}`)} — ${runDate}`);

      if (run.gitCommitMessage) {
        const commitMsg = run.gitCommitMessage.split('\n')[0];
        logger.log(`  Commit: ${chalk.gray(commitMsg)}`);
      }

      // Fetch run details to get jobs
      logger.info(chalk.gray(`  Fetching run details...`));
      const runDetails = await runEASCommand(
        ['workflow:view', run.id, '--json', '--non-interactive'],
        projectDir,
        easEnv
      );

      if (!runDetails?.jobs) {
        logger.warn(`  Could not fetch run details.`);
        continue;
      }

      const failedJobs = runDetails.jobs.filter(
        (j: any) => (j.status ?? '').toUpperCase() === 'FAILURE'
      );

      if (!failedJobs.length) {
        logger.log(`  ${chalk.gray('No failed jobs found.')}`);
        continue;
      }

      if (runDetails.logURL) {
        logger.log(`  ${chalk.gray(runDetails.logURL)}`);
      }

      logger.log(`  ${chalk.red(`${failedJobs.length} failed job(s)`)}:\n`);

      for (const job of failedJobs) {
        const jobName = job.name ?? job.key ?? 'unknown';
        logger.log(`  ${chalk.red('✗')} ${chalk.bold(jobName)}`);

        // Download logs for this job
        logger.info(chalk.gray(`    Downloading log for "${jobName}"...`));

        let rawLog: string | null = null;
        try {
          const result = await spawnAsync(
            'eas',
            ['workflow:logs', job.id, '--all-steps', '--non-interactive'],
            { cwd: projectDir, env: easEnv }
          );
          rawLog = result.stdout;
        } catch {
          logger.warn(`    Could not download log for this job.`);
          continue;
        }

        if (!rawLog?.trim()) {
          logger.warn(`    Log is empty.`);
          continue;
        }

        const log = stripLogTimestamps(rawLog);
        const snippets = extractErrorSnippets(log);
        if (snippets.length) {
          printLogSnippets(snippets);
        }

        logger.log('');
      }
    }

    printFailurePatternSummary(
      failed.map((r: any) => ({ timestamp: new Date(r.startedAt ?? r.createdAt) })),
      startDate,
      endDate
    );

    return true;
  }

  return false;
}

/**
 * Inspect a workflow by name — tries GitHub Actions first, then Expo Workflows.
 */
async function inspectWorkflow(
  workflowName: string,
  branch: string,
  startDate: Date,
  endDate: Date,
  auth: AuthStatus
): Promise<void> {
  logger.log(chalk.bold(`\nInspecting workflow: ${chalk.cyan(workflowName)}\n`) + '─'.repeat(40));

  // Try GitHub Actions first
  if (auth.github) {
    const found = await inspectGitHubWorkflow(workflowName, branch, startDate, endDate);
    if (found) return;
  }

  // Fall back to Expo Workflows
  if (auth.eas) {
    const found = await inspectEASWorkflow(workflowName, startDate, endDate);
    if (found) return;
  }

  // No match found anywhere — list available workflows
  logger.warn(`No workflows found matching "${workflowName}".`);

  if (auth.github) {
    logger.log('\nAvailable GitHub Actions workflows:');
    try {
      const runs = await getWorkflowRunsForRepoAsync(branch, { startDate, endDate });
      const names = [...new Set(runs.map((r: any) => r.name).filter(Boolean))].sort();
      for (const name of names) {
        logger.log(`  - ${name}`);
      }
    } catch {
      // Already fetched above, skip
    }
  }

  if (auth.eas) {
    logger.log('\nAvailable Expo Workflows:');
    try {
      const projectDirs = await findEASProjectDirs();
      const easEnv = {
        ...process.env,
        EXPO_NO_DOCTOR: 'true',
        EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE ?? 'release-client',
      };
      for (const projectDir of projectDirs) {
        const projectName = path.basename(projectDir);
        const allRuns = await fetchEASRuns(projectDir, projectName, easEnv);
        const names = [
          ...new Set(allRuns.map((r: any) => r.workflowName ?? r.workflow_name).filter(Boolean)),
        ].sort();
        if (names.length) {
          logger.log(`  ${chalk.gray(`[${projectName}]`)}`);
          for (const name of names) {
            logger.log(`  - ${name}`);
          }
        }
      }
    } catch {
      // Skip
    }
  }
}

async function action(options: ActionOptions) {
  const branch = options.branch;
  const [startDate, endDate, weekNum] = parseDateRange(options.week);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  logger.log(chalk.bold(`\nCI Status Overview — ${branch} — Week ${weekNum}\n`) + '─'.repeat(40));
  logger.info(`Date range: ${chalk.cyan(startStr)} to ${chalk.cyan(endStr)}\n`);

  const auth = await checkAuth();
  printAuthStatus(auth);

  if (!auth.github && !auth.eas) {
    logger.error('No services authenticated. Please log in to at least one service above.');
    return;
  }

  // --inspect mode: deep-dive into a specific workflow's failures
  if (options.inspect) {
    await inspectWorkflow(options.inspect, branch, startDate, endDate, auth);
    logger.info(chalk.green('Done\n'));
    return;
  }

  const allResults: SectionResult[] = [];

  if (auth.github) {
    const result = await printGitHubActionsStatus(branch, startDate, endDate);
    if (result) allResults.push(result);
  }

  if (auth.eas) {
    const results = await printExpoWorkflowsStatus(startDate, endDate);
    allResults.push(...results);
  }

  if (allResults.length > 0) {
    printSummary(allResults);
    printWeekTrend(allResults);
  }

  logger.info(chalk.green('Done\n'));
}

function printSummary(results: SectionResult[]): void {
  logger.log('─'.repeat(40));
  logger.info(`\n${chalk.bold('Summary')}\n`);

  // Overall health per section
  for (const result of results) {
    const healthIcon =
      result.successRate >= 90
        ? chalk.green('healthy')
        : result.successRate >= 75
          ? chalk.yellow('needs attention')
          : chalk.red('needs immediate attention');
    logger.log(
      `  ${chalk.bold(result.source)}: ${result.successRate.toFixed(1)}% success rate across ${result.totalRuns} runs — ${healthIcon}`
    );
  }

  // Combined stats using the same success rate logic (cancelled counted as success)
  const allWorkflows = results.flatMap((r) => r.workflows);
  const totalRuns = allWorkflows.reduce((s, w) => s + w.total, 0);
  const totalFailed = allWorkflows.reduce((s, w) => s + w.failed, 0);
  const totalSuccess = allWorkflows.reduce((s, w) => s + w.success, 0);
  const totalCancelled = allWorkflows.reduce((s, w) => s + w.cancelled, 0);
  const effectiveSuccess = totalSuccess + totalCancelled;
  const overallRate = totalRuns > 0 ? (effectiveSuccess / totalRuns) * 100 : 100;

  logger.log(
    `\n  ${chalk.bold('Overall')}: ${totalRuns} total runs, ${chalk.red(`${totalFailed} failures`)}, ${successRateColor(overallRate)} success rate\n`
  );

  // Identify workflows that need attention (success rate < 75% with at least 2 runs)
  // Exclude workflows with only "other" runs (no success or failure conclusions yet)
  const troubleWorkflows = allWorkflows
    .filter((w) => w.successRate < 75 && w.total >= 2 && w.success + w.failed + w.cancelled > 0)
    .sort((a, b) => a.successRate - b.successRate);

  if (troubleWorkflows.length > 0) {
    logger.info(`  ${chalk.bold('Workflows needing attention:')}\n`);
    for (const w of troubleWorkflows) {
      logger.log(
        `    ${chalk.red('→')} ${w.name}: ${chalk.red(`${w.failed}`)} failed out of ${w.total} runs (${successRateColor(w.successRate)} success rate)`
      );
    }
    logger.log('');
  }

  // Identify consistently failing workflows (0% success rate, with actual failures)
  const alwaysFailing = allWorkflows.filter((w) => w.successRate === 0 && w.failed >= 2);
  if (alwaysFailing.length > 0) {
    logger.warn(
      `  ${alwaysFailing.length} workflow(s) with 0% success rate — these may be broken and need investigation:`
    );
    for (const w of alwaysFailing) {
      logger.log(`    ${chalk.red('✗')} ${w.name} (${w.total} runs, ${w.failed} failed)`);
    }
    logger.log('');
  }

  // Highlight workflows with high volume + moderate failure rate
  const highVolumeIssues = allWorkflows
    .filter((w) => w.total >= 10 && w.successRate < 90 && w.failed > 0)
    .sort((a, b) => b.failed - a.failed);

  if (highVolumeIssues.length > 0) {
    logger.info(`  ${chalk.bold('High-volume workflows with elevated failure rates:')}\n`);
    for (const w of highVolumeIssues) {
      logger.log(
        `    ${chalk.yellow('!')} ${w.name}: ${w.total} runs, ${chalk.red(`${w.failed}`)} failures (${successRateColor(w.successRate)})`
      );
    }
    logger.log('');
  }

  // Final recommendation based on the consistent success rate calculation
  if (overallRate >= 90) {
    logger.info(chalk.green('  CI is healthy — no immediate action required.\n'));
  } else if (overallRate >= 75) {
    logger.info(chalk.yellow('  CI needs attention — review the flagged workflows above.\n'));
  } else {
    logger.info(
      chalk.red(
        '  CI needs immediate attention — significant failure rates detected. Prioritize investigating the workflows listed above.\n'
      )
    );
  }
}

export default (program: Command) => {
  program
    .command('ci-status')
    .alias('ci', 'cis')
    .description(
      'Shows an overview of CI status for GitHub Actions and Expo Workflows on a branch. ' +
        'Displays success rates, failure breakdowns, and weekly trends. ' +
        'Use --inspect to deep-dive into a specific GitHub Actions workflow — ' +
        'downloads failed job logs and extracts error output for analysis (works great with Claude Code).'
    )
    .option('-b, --branch <branch>', 'Branch to check', 'main')
    .option(
      '-w, --week <week>',
      'ISO week number (1-53), or "last"/"prev" for previous week. Defaults to current week.'
    )
    .option(
      '-i, --inspect <workflow>',
      'Deep-inspect a workflow by name (partial match). ' +
        'Searches GitHub Actions first, then Expo Workflows. ' +
        'Fetches the 3 most recent failed runs, downloads job logs, and extracts error snippets. ' +
        'Example: --inspect "iOS Unit Tests"'
    )
    .asyncAction(action);
};
