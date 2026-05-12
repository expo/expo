import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { glob } from 'glob';
import ora from 'ora';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import { getAuthenticatedUserAsync } from '../GitHub';
import {
  downloadJobLogsAsync,
  getJobsForWorkflowRunAsync,
  getWorkflowRunsForRepoAsync,
} from '../GitHubActions';
import logger from '../Logger';

// --- TUI helpers ---

const MAX_VISIBLE_ITEMS = 15;

function waitForKey(validKeys: string[]): Promise<string> {
  return new Promise((resolve) => {
    const { stdin } = process;
    const wasRaw = stdin.isRaw;

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (data: string) => {
      let key: string;

      if (data === '\u001b[A') {
        key = 'up';
      } else if (data === '\u001b[B') {
        key = 'down';
      } else if (data === '\r' || data === '\n') {
        key = 'enter';
      } else if (data === '\u001b' || data === '\u001b\u001b') {
        key = 'escape';
      } else if (data === '\u0003') {
        stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.exit(0);
      } else {
        key = data.toLowerCase();
      }

      if (validKeys.includes(key)) {
        stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        stdin.removeListener('data', onData);
        resolve(key);
      }
    };

    stdin.on('data', onData);
  });
}

function clearLines(count: number): void {
  for (let i = 0; i < count; i++) {
    process.stdout.write('\x1b[1A\x1b[2K');
  }
}

function getScrollWindow(total: number, selectedIndex: number): { start: number; end: number } {
  if (total <= MAX_VISIBLE_ITEMS) {
    return { start: 0, end: total };
  }

  const half = Math.floor(MAX_VISIBLE_ITEMS / 2);
  let start = selectedIndex - half;
  if (start < 0) start = 0;
  let end = start + MAX_VISIBLE_ITEMS;
  if (end > total) {
    end = total;
    start = end - MAX_VISIBLE_ITEMS;
  }

  return { start, end };
}

// --- Types ---

type ActionOptions = {
  branch: string;
  week?: string;
};

type AuthStatus = {
  github: boolean;
  githubUser: string | null;
  eas: boolean;
  easUser: string | null;
};

interface DailyRate {
  label: string; // Mon, Tue, etc.
  date: string; // YYYY-MM-DD
  total: number;
  successful: number;
}

type FailedRun = {
  id: number | string;
  date: string;
  url?: string;
  commitMessage?: string;
  source: 'github' | 'eas';
  project?: string;
};

type WorkflowItem = {
  name: string;
  source: 'github' | 'eas';
  project?: string;
  total: number;
  success: number;
  failed: number;
  cancelled: number;
  other: number;
  successRate: number;
  dailyRates: DailyRate[];
  failedRuns: FailedRun[];
};

type CategoryInfo = {
  key: string;
  label: string;
  guidance: string;
  items: WorkflowItem[];
};

// --- Date utilities ---

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getMondayOfWeek(week: number, year: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (dayOfWeek - 1));
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function parseDateRange(weekOption?: string): [Date, Date, number, Date] {
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

  const dataEndDate = friday < now ? friday : now;
  return [monday, dataEndDate, targetWeek, friday];
}

// --- Classification + stats helpers ---

function classifyGitHubRun(run: any): 'success' | 'failure' | 'cancelled' | 'other' {
  if (run.conclusion === 'success') return 'success';
  if (run.conclusion === 'failure') return 'failure';
  if (run.conclusion === 'cancelled') return 'cancelled';
  return 'other';
}

function classifyEASRun(run: any): 'success' | 'failure' | 'cancelled' | 'other' {
  const status = (run.status ?? '').toUpperCase();
  if (status === 'SUCCESS' || status === 'FINISHED') return 'success';
  if (status === 'FAILURE' || status === 'ERRORED') return 'failure';
  if (status === 'CANCELED') return 'cancelled';
  return 'other';
}

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
  const concluded = success + failed + cancelled;
  const successRate = concluded > 0 ? ((success + cancelled) / concluded) * 100 : 0;
  return { total, success, failed, cancelled, other, successRate };
}

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

function successRateColor(rate: number): string {
  const pct = `${rate.toFixed(1)}%`;
  if (rate >= 90) return chalk.green(pct);
  if (rate >= 75) return chalk.yellow(pct);
  return chalk.red(pct);
}

// --- Auth helpers ---

async function checkAuth(): Promise<AuthStatus> {
  const status: AuthStatus = { github: false, githubUser: null, eas: false, easUser: null };

  if (process.env.GITHUB_TOKEN) {
    try {
      const user = await getAuthenticatedUserAsync();
      status.github = true;
      status.githubUser = user.login;
    } catch {
      // Token exists but is invalid
    }
  }

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
  const warnings: string[] = [];
  if (!auth.github) {
    warnings.push(
      `GitHub: ${chalk.red('\u2717')} not authenticated \u2014 run ${chalk.cyan('export GITHUB_TOKEN="$(gh auth token)"')}`
    );
  }
  if (!auth.eas) {
    warnings.push(
      `EAS: ${chalk.red('\u2717')} not authenticated \u2014 run ${chalk.cyan('eas login')}`
    );
  }
  if (warnings.length > 0) {
    for (const w of warnings) {
      logger.log(`  ${w}`);
    }
    logger.log('');
  }
}

// --- EAS helpers ---

async function findEASProjectDirs(): Promise<string[]> {
  const pattern = 'apps/*/.eas/workflows';
  const matches = await glob(pattern, { cwd: EXPO_DIR });
  return matches.map((match) => path.resolve(EXPO_DIR, path.dirname(path.dirname(match))));
}

/**
 * Fetches workflow runs from EAS CLI for a given project.
 *
 * **Limitation:** The EAS CLI returns at most 100 runs across ALL workflows in the project,
 * with no server-side date filtering. Date filtering is done client-side after fetching.
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

// --- Log analysis helpers ---

function extractErrorSnippets(log: string, maxLines: number = 80): string[] {
  const lines = log.split('\n');
  const snippets: string[] = [];

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

  const errorLineIndices = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of errorPatterns) {
      if (pattern.test(lines[i])) {
        for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 10); j++) {
          errorLineIndices.add(j);
        }
        break;
      }
    }
  }

  if (errorLineIndices.size > 0) {
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

  if (snippets.length === 0) {
    const tail = lines.slice(-maxLines).join('\n');
    if (tail.trim()) {
      snippets.push(tail);
    }
  }

  const joined = snippets.join('\n...\n');
  const joinedLines = joined.split('\n');
  if (joinedLines.length > maxLines) {
    return [joinedLines.slice(0, maxLines).join('\n') + '\n... (truncated)'];
  }
  return snippets;
}

function stripLogTimestamps(log: string): string {
  return log.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z /gm, '');
}

function printLogSnippets(snippets: string[]): void {
  logger.log(`\n    ${chalk.bold('Error output:')}`);
  logger.log('    \u250c' + '\u2500'.repeat(70));
  for (let si = 0; si < snippets.length; si++) {
    const indented = snippets[si]
      .split('\n')
      .map((line) => `    \u2502 ${line}`)
      .join('\n');
    logger.log(indented);
    if (si < snippets.length - 1) {
      logger.log('    \u2502 ...');
    }
  }
  logger.log('    \u2514' + '\u2500'.repeat(70));
}

// --- Data fetching (returns WorkflowItem[]) ---

async function fetchGitHubWorkflowItems(
  branch: string,
  startDate: Date,
  endDate: Date
): Promise<WorkflowItem[]> {
  const runs = await getWorkflowRunsForRepoAsync(branch, { startDate, endDate });
  if (!runs.length) return [];

  const byWorkflow = new Map<string, any[]>();
  for (const run of runs) {
    const name = run.name ?? 'unknown';
    if (!byWorkflow.has(name)) byWorkflow.set(name, []);
    byWorkflow.get(name)!.push(run);
  }

  const items: WorkflowItem[] = [];
  for (const [name, wfRuns] of byWorkflow) {
    const stats = countRunStats(wfRuns, classifyGitHubRun);
    const dailyRates = computeDailyRates(
      wfRuns,
      startDate,
      (r) => r.created_at ?? r.run_started_at,
      (r) => {
        const c = classifyGitHubRun(r);
        return c === 'success' || c === 'cancelled';
      },
      (r) => classifyGitHubRun(r) !== 'other'
    );

    const failed = wfRuns
      .filter((r: any) => r.conclusion === 'failure')
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        date: new Date(r.created_at).toISOString().slice(0, 10),
        url: r.html_url,
        commitMessage: r.head_commit?.message?.split('\n')[0],
        source: 'github' as const,
      }));

    items.push({
      name,
      source: 'github',
      ...stats,
      dailyRates,
      failedRuns: failed,
    });
  }

  return items;
}

async function fetchEASWorkflowItems(startDate: Date, endDate: Date): Promise<WorkflowItem[]> {
  let projectDirs: string[];
  try {
    projectDirs = await findEASProjectDirs();
  } catch {
    return [];
  }
  if (!projectDirs.length) return [];

  const easEnv = {
    ...process.env,
    EXPO_NO_DOCTOR: 'true',
    EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE ?? 'release-client',
  };

  const items: WorkflowItem[] = [];

  for (const projectDir of projectDirs) {
    const projectName = path.basename(projectDir);
    const allRuns = await fetchEASRuns(projectDir, projectName, easEnv);

    const runsInRange = allRuns.filter((r) => {
      const ts = r.startedAt ?? r.createdAt ?? r.created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return d >= startDate && d <= endDate;
    });

    if (!runsInRange.length) continue;

    const byWorkflow = new Map<string, any[]>();
    for (const run of runsInRange) {
      const name = run.workflowName ?? run.workflow_name ?? 'unknown';
      if (!byWorkflow.has(name)) byWorkflow.set(name, []);
      byWorkflow.get(name)!.push(run);
    }

    for (const [name, wfRuns] of byWorkflow) {
      const stats = countRunStats(wfRuns, classifyEASRun);
      const dailyRates = computeDailyRates(
        wfRuns,
        startDate,
        (r) => r.startedAt ?? r.createdAt ?? r.created_at,
        (r) => {
          const c = classifyEASRun(r);
          return c === 'success' || c === 'cancelled';
        },
        (r) => classifyEASRun(r) !== 'other'
      );

      const failed = wfRuns
        .filter((r: any) => {
          const s = (r.status ?? '').toUpperCase();
          return s === 'FAILURE' || s === 'ERRORED';
        })
        .slice(0, 5)
        .map((r: any) => ({
          id: r.id,
          date: new Date(r.startedAt ?? r.createdAt).toISOString().slice(0, 10),
          commitMessage: r.gitCommitMessage?.split('\n')[0],
          source: 'eas' as const,
          project: projectName,
        }));

      items.push({
        name,
        source: 'eas',
        project: projectName,
        ...stats,
        dailyRates,
        failedRuns: failed,
      });
    }
  }

  return items;
}

// --- Category building ---

function buildCategories(items: WorkflowItem[]): CategoryInfo[] {
  const broken = items.filter((w) => w.successRate === 0 && w.total >= 2 && w.failed >= 2);
  const needsAttention = items.filter(
    (w) => w.successRate > 0 && w.successRate < 75 && w.total >= 2 && w.failed > 0
  );
  const highVolume = items.filter((w) => w.total >= 10 && w.successRate < 90 && w.failed > 0);
  const allSorted = [...items].sort((a, b) => b.total - a.total);

  return [
    {
      key: 'broken',
      label: 'Broken Workflows',
      guidance: 'These workflows are consistently failing and need immediate investigation.',
      items: broken.sort((a, b) => b.failed - a.failed),
    },
    {
      key: 'attention',
      label: 'Needs Attention',
      guidance:
        'These workflows have elevated failure rates. Review recent failures to identify patterns.',
      items: needsAttention.sort((a, b) => a.successRate - b.successRate),
    },
    {
      key: 'high-volume',
      label: 'High Volume Issues',
      guidance:
        'Frequently-running workflows with notable failure rates \u2014 even small percentages add up.',
      items: highVolume.sort((a, b) => b.failed - a.failed),
    },
    {
      key: 'all',
      label: 'All Workflows',
      guidance: 'Complete overview of all workflows sorted by run count.',
      items: allSorted,
    },
  ];
}

// --- Interactive display helpers ---

function showCompactStatus(
  weekNum: number,
  startStr: string,
  endStr: string,
  branch: string,
  ghItems: WorkflowItem[],
  easItems: WorkflowItem[],
  categories: CategoryInfo[]
): void {
  const ghTotal = ghItems.reduce((s, w) => s + w.total, 0);
  const ghSuccess = ghItems.reduce((s, w) => s + w.success, 0);
  const ghCancelled = ghItems.reduce((s, w) => s + w.cancelled, 0);
  const ghRate = ghTotal > 0 ? ((ghSuccess + ghCancelled) / ghTotal) * 100 : 0;

  const easTotal = easItems.reduce((s, w) => s + w.total, 0);
  const easSuccess = easItems.reduce((s, w) => s + w.success, 0);
  const easCancelled = easItems.reduce((s, w) => s + w.cancelled, 0);
  const easRate = easTotal > 0 ? ((easSuccess + easCancelled) / easTotal) * 100 : 0;

  const brokenCount = categories.find((c) => c.key === 'broken')?.items.length ?? 0;
  const attentionCount = categories.find((c) => c.key === 'attention')?.items.length ?? 0;

  logger.log('');
  logger.log(
    chalk.bold(`CI Metrics \u2014 Week ${weekNum} (${startStr} \u2192 ${endStr}) \u2014 ${branch}`)
  );
  logger.log('');

  if (ghTotal > 0) {
    logger.log(`  GitHub Actions: ${ghTotal} runs, ${successRateColor(ghRate)} success rate`);
  }
  if (easTotal > 0) {
    logger.log(`  Expo Workflows: ${easTotal} runs, ${successRateColor(easRate)} success rate`);
  }
  if (ghTotal === 0 && easTotal === 0) {
    logger.log(chalk.gray('  No workflow runs found.'));
  }

  const alerts: string[] = [];
  if (brokenCount > 0) alerts.push(chalk.red(`${brokenCount} broken`));
  if (attentionCount > 0) alerts.push(chalk.yellow(`${attentionCount} needs attention`));
  if (alerts.length > 0) {
    logger.log(`  ${alerts.join(', ')}`);
  }

  logger.log('');
}

function showCategoryList(categories: CategoryInfo[], selectedIndex: number): void {
  const recommendedIdx = categories.findIndex((c) => c.key !== 'all' && c.items.length > 0);

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const prefix = i === selectedIndex ? chalk.green('\u25b6') : ' ';
    const badge = i === recommendedIdx ? chalk.bgGreen.black(' RECOMMENDED ') + ' ' : '';
    const count = chalk.cyan(`(${cat.items.length})`);
    logger.log(`  ${prefix} ${chalk.green(`${i + 1}.`)} ${badge}${chalk.bold(cat.label)} ${count}`);
    logger.log(chalk.dim(`       ${cat.guidance}`));
    logger.log('');
  }
  logger.log(chalk.gray('  \u2191\u2193 navigate / Enter select / Esc quit'));
}

function categoryLineCount(categories: CategoryInfo[]): number {
  // Each category: prefix line + guidance line + blank line, plus the hint line
  return categories.length * 3 + 1;
}

function showWorkflowList(category: CategoryInfo, selectedIndex: number): void {
  const total = category.items.length;
  const { start, end } = getScrollWindow(total, selectedIndex);

  logger.log(chalk.bold(category.label));
  logger.log(chalk.dim(`  ${category.guidance}`));
  logger.log('');

  if (total === 0) {
    logger.log(chalk.gray('  No workflows in this category.'));
    logger.log('');
    logger.log(chalk.gray('  Esc back'));
    return;
  }

  if (start > 0) {
    logger.log(chalk.gray(`  \u25b2 ${start} more above`));
  }

  for (let i = start; i < end; i++) {
    const wf = category.items[i];
    const prefix = i === selectedIndex ? chalk.green('\u25b6') : ' ';
    const pos = chalk.gray(`${i + 1}/${total}`);
    const sourceTag = wf.source === 'eas' ? chalk.gray(`[${wf.project}] `) : '';
    const statsStr = `${wf.total} runs, ${successRateColor(wf.successRate)}, ${chalk.red(`${wf.failed}`)} failed`;

    logger.log(`  ${prefix} ${pos} ${sourceTag}${wf.name} \u2014 ${statsStr}`);
  }

  if (end < total) {
    logger.log(chalk.gray(`  \u25bc ${total - end} more below`));
  }

  logger.log('');
  logger.log(chalk.gray('  \u2191\u2193 navigate / Enter expand / Esc back'));
}

function workflowListLineCount(category: CategoryInfo, selectedIndex: number): number {
  const total = category.items.length;
  if (total === 0) {
    // Title + guidance + blank + "no workflows" + blank + hint
    return 6;
  }
  const { start, end } = getScrollWindow(total, selectedIndex);
  const visibleItems = end - start;
  const hasAbove = start > 0 ? 1 : 0;
  const hasBelow = end < total ? 1 : 0;
  // Title + guidance + blank + above? + items + below? + blank + hint
  return 3 + hasAbove + visibleItems + hasBelow + 2;
}

function renderDailyTrend(dailyRates: DailyRate[]): number {
  let lines = 0;
  const barWidth = 15;

  logger.log(chalk.bold('  Daily Trend'));
  lines++;

  let prevRate: number | null = null;
  for (const day of dailyRates) {
    const rate = day.total > 0 ? (day.successful / day.total) * 100 : -1;

    if (rate < 0) {
      logger.log(`    ${chalk.gray(day.label)}  ${chalk.gray('\u2014  no data')}`);
      lines++;
      continue;
    }

    const filled = Math.round((rate / 100) * barWidth);
    const barColor = rate >= 90 ? chalk.green : rate >= 75 ? chalk.yellow : chalk.red;
    const bar = barColor('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(barWidth - filled));

    let trend = '  ';
    if (prevRate !== null) {
      const diff = rate - prevRate;
      if (diff > 2) trend = chalk.green('\u2191');
      else if (diff < -2) trend = chalk.red('\u2193');
      else trend = chalk.gray('\u2192');
    }

    logger.log(
      `    ${day.label}  ${bar}  ${successRateColor(rate)}  ${trend}  ${chalk.gray(`(${day.total} runs)`)}`
    );
    lines++;
    prevRate = rate;
  }

  logger.log('');
  lines++;
  return lines;
}

function renderDetailView(wf: WorkflowItem, showFailed: boolean): number {
  let lines = 0;

  const sourceTag = wf.source === 'eas' ? chalk.gray(` [${wf.project}]`) : '';
  logger.log(chalk.bold(`${wf.name}${sourceTag}`));
  lines++;
  logger.log('');
  lines++;

  logger.log(
    `  Total: ${wf.total}  ${chalk.green(`${wf.success} success`)}  ${chalk.red(`${wf.failed} failed`)}  ${chalk.gray(`${wf.cancelled} cancelled`)}  ${chalk.gray(`${wf.other} other`)}`
  );
  lines++;
  logger.log(`  Success rate: ${successRateColor(wf.successRate)}`);
  lines++;
  logger.log('');
  lines++;

  lines += renderDailyTrend(wf.dailyRates);

  if (showFailed) {
    logger.log(chalk.bold('  Recent Failed Runs'));
    lines++;
    if (wf.failedRuns.length === 0) {
      logger.log(chalk.gray('    No failed runs.'));
      lines++;
    } else {
      for (const run of wf.failedRuns) {
        const commit = run.commitMessage ? chalk.gray(` \u2014 ${run.commitMessage}`) : '';
        const url = run.url ? chalk.gray(` ${run.url}`) : '';
        logger.log(`    ${chalk.red('\u2717')} ${run.date}${commit}${url}`);
        lines++;
      }
    }
    logger.log('');
    lines++;
  }

  const failedToggle = showFailed ? chalk.yellow('(f)ailed runs') : chalk.green('(f)ailed runs');
  const parts = [failedToggle, chalk.green('(l)ogs'), chalk.gray('Esc back')];
  logger.log(chalk.gray('  ') + parts.join(chalk.gray(' / ')));
  lines++;

  return lines;
}

// --- Log inspection ---

async function inspectLatestFailureLogs(wf: WorkflowItem): Promise<void> {
  if (wf.failedRuns.length === 0) {
    logger.log(chalk.gray('  No failed runs to inspect.'));
    return;
  }

  const latestFailed = wf.failedRuns[0];

  if (wf.source === 'github') {
    logger.log(chalk.gray(`  Downloading logs for run ${latestFailed.id}...`));

    let jobs;
    try {
      jobs = await getJobsForWorkflowRunAsync(latestFailed.id as number);
    } catch (error: any) {
      logger.warn(`  Failed to fetch jobs: ${error.message}`);
      return;
    }

    const failedJobs = jobs.filter((j) => j.conclusion === 'failure');
    if (!failedJobs.length) {
      logger.log(chalk.gray('  No failed jobs found.'));
      return;
    }

    for (const job of failedJobs) {
      logger.log(`\n  ${chalk.red('\u2717')} ${chalk.bold(job.name)}`);

      const failedSteps = (job.steps ?? []).filter((s) => s.conclusion === 'failure');
      for (const step of failedSteps) {
        logger.log(`    Step: ${chalk.red(step.name)}`);
      }

      const rawLog = await downloadJobLogsAsync(job.id);
      if (!rawLog) {
        logger.warn(`    Could not download log.`);
        continue;
      }

      const log = stripLogTimestamps(rawLog);
      const snippets = extractErrorSnippets(log);
      if (snippets.length) {
        printLogSnippets(snippets);
      }
    }
  } else {
    // EAS workflow logs
    if (!wf.project) {
      logger.log(chalk.gray('  No project info available for this EAS workflow.'));
      return;
    }

    const projectDirs = await findEASProjectDirs();
    const projectDir = projectDirs.find((d) => path.basename(d) === wf.project);
    if (!projectDir) {
      logger.log(chalk.gray(`  Could not find project directory for ${wf.project}.`));
      return;
    }

    const easEnv = {
      ...process.env,
      EXPO_NO_DOCTOR: 'true',
      EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE ?? 'release-client',
    };

    logger.log(chalk.gray(`  Fetching run details for ${latestFailed.id}...`));

    const runDetails = await runEASCommand(
      ['workflow:view', String(latestFailed.id), '--json', '--non-interactive'],
      projectDir,
      easEnv
    );

    if (!runDetails?.jobs) {
      logger.warn(`  Could not fetch run details.`);
      return;
    }

    const failedJobs = runDetails.jobs.filter(
      (j: any) => (j.status ?? '').toUpperCase() === 'FAILURE'
    );

    if (!failedJobs.length) {
      logger.log(chalk.gray('  No failed jobs found.'));
      return;
    }

    if (runDetails.logURL) {
      logger.log(`  ${chalk.gray(runDetails.logURL)}`);
    }

    for (const job of failedJobs) {
      const jobName = job.name ?? job.key ?? 'unknown';
      logger.log(`\n  ${chalk.red('\u2717')} ${chalk.bold(jobName)}`);

      logger.log(chalk.gray(`    Downloading log for "${jobName}"...`));

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
    }
  }
}

// --- Interactive detail view ---

async function showDetailInteractive(wf: WorkflowItem): Promise<void> {
  let showFailed = false;
  let lastRenderedCount = 0;

  const render = () => {
    if (lastRenderedCount > 0) clearLines(lastRenderedCount);
    lastRenderedCount = renderDetailView(wf, showFailed);
  };

  render();

  while (true) {
    const key = await waitForKey(['escape', 'f', 'l']);

    if (key === 'escape') {
      if (showFailed) {
        showFailed = false;
        render();
      } else {
        clearLines(lastRenderedCount);
        return;
      }
    } else if (key === 'f') {
      showFailed = !showFailed;
      render();
    } else if (key === 'l') {
      await inspectLatestFailureLogs(wf);
      logger.log('');
      logger.log(chalk.gray('  Press any key to continue...'));
      await waitForKey(['escape', 'f', 'l', 'enter', 'up', 'down']);
      // After viewing logs, reset since output has scrolled
      lastRenderedCount = 0;
      render();
    }
  }
}

// --- Interactive dashboard ---

async function interactiveDashboard(options: ActionOptions, auth: AuthStatus): Promise<void> {
  const branch = options.branch;
  const [startDate, endDate, weekNum, weekFriday] = parseDateRange(options.week);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = weekFriday.toISOString().slice(0, 10);

  const spinner = ora('Loading CI/CD metrics...').start();

  let [ghItems, easItems] = await Promise.all([
    auth.github
      ? fetchGitHubWorkflowItems(branch, startDate, endDate).catch((err) => {
          spinner.warn(`GitHub Actions fetch failed: ${err.message}`);
          return [] as WorkflowItem[];
        })
      : Promise.resolve([] as WorkflowItem[]),
    auth.eas
      ? fetchEASWorkflowItems(startDate, endDate).catch((err) => {
          spinner.warn(`Expo Workflows fetch failed: ${err.message}`);
          return [] as WorkflowItem[];
        })
      : Promise.resolve([] as WorkflowItem[]),
  ]);

  spinner.stop();

  let allItems = [...ghItems, ...easItems];
  let categories = buildCategories(allItems);

  showCompactStatus(weekNum, startStr, endStr, branch, ghItems, easItems, categories);

  if (allItems.length === 0) {
    return;
  }

  // Category selection
  let catIndex = 0;
  showCategoryList(categories, catIndex);

  while (true) {
    const key = await waitForKey(['up', 'down', 'enter', 'escape']);

    if (key === 'escape') {
      clearLines(categoryLineCount(categories));
      return;
    } else if (key === 'up') {
      if (catIndex > 0) {
        clearLines(categoryLineCount(categories));
        catIndex--;
        showCategoryList(categories, catIndex);
      }
    } else if (key === 'down') {
      if (catIndex < categories.length - 1) {
        clearLines(categoryLineCount(categories));
        catIndex++;
        showCategoryList(categories, catIndex);
      }
    } else if (key === 'enter') {
      clearLines(categoryLineCount(categories));
      const selectedCategory = categories[catIndex];

      // Workflow browsing within category
      let wfIndex = 0;
      showWorkflowList(selectedCategory, wfIndex);

      let lastLineCount = workflowListLineCount(selectedCategory, wfIndex);
      let backToCategories = false;

      while (true) {
        const wfKey = await waitForKey(['up', 'down', 'enter', 'escape', 'r']);

        if (wfKey === 'escape') {
          clearLines(lastLineCount);
          backToCategories = true;
          break;
        } else if (wfKey === 'up') {
          if (wfIndex > 0) {
            clearLines(lastLineCount);
            wfIndex--;
            showWorkflowList(selectedCategory, wfIndex);
            lastLineCount = workflowListLineCount(selectedCategory, wfIndex);
          }
        } else if (wfKey === 'down') {
          if (wfIndex < selectedCategory.items.length - 1) {
            clearLines(lastLineCount);
            wfIndex++;
            showWorkflowList(selectedCategory, wfIndex);
            lastLineCount = workflowListLineCount(selectedCategory, wfIndex);
          }
        } else if (wfKey === 'enter' && selectedCategory.items.length > 0) {
          clearLines(lastLineCount);
          const wf = selectedCategory.items[wfIndex];

          await showDetailInteractive(wf);

          // Re-show workflow list
          showWorkflowList(selectedCategory, wfIndex);
          lastLineCount = workflowListLineCount(selectedCategory, wfIndex);
        } else if (wfKey === 'r') {
          clearLines(lastLineCount);
          const reloadSpinner = ora('Reloading data...').start();

          const [newGhItems, newEasItems] = await Promise.all([
            auth.github
              ? fetchGitHubWorkflowItems(branch, startDate, endDate).catch(
                  () => [] as WorkflowItem[]
                )
              : Promise.resolve([] as WorkflowItem[]),
            auth.eas
              ? fetchEASWorkflowItems(startDate, endDate).catch(() => [] as WorkflowItem[])
              : Promise.resolve([] as WorkflowItem[]),
          ]);

          reloadSpinner.stop();

          ghItems = newGhItems;
          easItems = newEasItems;
          allItems = [...ghItems, ...easItems];
          categories = buildCategories(allItems);
          showCompactStatus(weekNum, startStr, endStr, branch, ghItems, easItems, categories);
          if (allItems.length === 0) {
            return;
          }
          catIndex = 0;
          backToCategories = true;
          break;
        }
      }

      if (backToCategories) {
        showCategoryList(categories, catIndex);
      }
    }
  }
}

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

// --- Entry point ---

async function action(options: ActionOptions) {
  const auth = await checkAuth();

  if (!auth.github && !auth.eas) {
    printAuthStatus(auth);
    logger.error('No services authenticated. Please log in to at least one service.');
    return;
  }

  printAuthStatus(auth);

  await interactiveDashboard(options, auth);
  logger.log('');
}

export default (program: Command) => {
  program
    .command('ci-inspect')
    .alias('ci', 'cii')
    .description(
      'Interactive CI/CD dashboard for GitHub Actions and Expo Workflows. ' +
        'Shows workflow health categories, success rates, daily trends, and failure inspection. ' +
        'Navigate with arrow keys, Enter to drill down, Esc to go back.'
    )
    .option('-b, --branch <branch>', 'Branch to check', 'main')
    .option(
      '-w, --week <week>',
      'ISO week number (1-53), or "last"/"prev" for previous week. Defaults to current week.'
    )
    .asyncAction(action);
};
