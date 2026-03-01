import { Command } from '@expo/commander';
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';

import {
  getAuthenticatedUserAsync,
  getIssueAsync,
  getIssueCloserPrUrlAsync,
  listAllCommentsAsync,
  listAllOpenIssuesAsync,
  listCommentsAsync,
  listOpenPullRequestsAsync,
  listPullRequestReviewsAsync,
  listRecentIssuesAsync,
  getPullRequestAsync,
} from '../GitHub';
import logger from '../Logger';
import { askQuestionAsync, authenticateAsync, isAuthenticatedAsync, setApiKey } from '../Unblocked';

type ActionOptions = {
  week?: string;
  label?: string;
  staleDays?: string;
};

type IssueItem = Awaited<ReturnType<typeof listAllOpenIssuesAsync>>[number];
type PRWithReviews = {
  pr: Awaited<ReturnType<typeof listOpenPullRequestsAsync>>[number];
  reviews: { state?: string }[];
};

type DashboardData = {
  needsReviewUnassigned: IssueItem[];
  needsReviewAssigned: IssueItem[];
  acceptedUnassigned: IssueItem[];
  unresponded: IssueItem[];
  stale: IssueItem[];
  externalPRs: PRWithReviews[];
  staleDays: number;
};

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

/**
 * Returns [startDate, dataEndDate, weekNumber, weekFriday].
 * dataEndDate is capped at now (for filtering), weekFriday is always the full week's Friday (for display).
 */
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

function isIssue(item: IssueItem): boolean {
  return !('pull_request' in item && item.pull_request);
}

function isAssigned(issue: IssueItem): boolean {
  return (issue.assignees ?? []).length > 0 || issue.assignee != null;
}

function isTeamResponse(comment: { author_association?: string }): boolean {
  return ['MEMBER', 'COLLABORATOR', 'OWNER'].includes(comment.author_association ?? '');
}

function getLabels(issue: { labels: IssueItem['labels'] }): { name?: string }[] {
  return issue.labels as { name?: string }[];
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + '…';
}

async function batchAsync<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

async function fetchNeedsReviewIssues(
  labelFilter?: string,
  spinner?: ora.Ora
): Promise<{ unassigned: IssueItem[]; assigned: IssueItem[] }> {
  if (spinner) spinner.text = 'Fetching issues with "needs review" label…';
  const labels = labelFilter ? `needs review,${labelFilter}` : 'needs review';
  const issues = await listAllOpenIssuesAsync({ labels, limit: 100 });
  const filtered = issues.filter(isIssue);
  return {
    unassigned: filtered.filter((i) => !isAssigned(i)),
    assigned: filtered.filter((i) => isAssigned(i)),
  };
}

async function fetchAcceptedUnassigned(
  labelFilter?: string,
  spinner?: ora.Ora
): Promise<IssueItem[]> {
  if (spinner) spinner.text = 'Fetching "issue accepted" issues without assignee…';
  const labels = labelFilter ? `issue accepted,${labelFilter}` : 'issue accepted';
  const issues = await listAllOpenIssuesAsync({ labels, limit: 100 });
  return issues.filter((i) => isIssue(i) && !isAssigned(i));
}

async function fetchUnrespondedIssues(
  startDate: Date,
  endDate: Date,
  labelFilter?: string,
  spinner?: ora.Ora
): Promise<IssueItem[]> {
  if (spinner) spinner.text = 'Fetching new/unresponded issues…';
  // Note: GitHub's `since` means "updated since", not "created since".
  // We filter by created_at below to get issues actually opened in this period.
  const issues = await listRecentIssuesAsync({
    since: startDate.toISOString(),
    state: 'open',
    labels: labelFilter,
    sort: 'created',
    direction: 'desc',
    per_page: 100,
  });

  const filtered = issues.filter((i) => {
    if (!isIssue(i)) return false;
    const created = new Date(i.created_at);
    return created >= startDate && created <= endDate;
  });

  // Check for team responses
  const results = await batchAsync(filtered.slice(0, 100), 10, async (issue) => {
    if (issue.comments === 0) return { issue, hasTeamResponse: false };
    try {
      const comments = await listCommentsAsync(issue.number, { per_page: 100 });
      return { issue, hasTeamResponse: comments.some(isTeamResponse) };
    } catch {
      return { issue, hasTeamResponse: false };
    }
  });

  return results.filter((r) => !r.hasTeamResponse).map((r) => r.issue);
}

async function fetchStaleIssues(
  staleDays: number,
  labelFilter?: string,
  spinner?: ora.Ora
): Promise<IssueItem[]> {
  if (spinner) spinner.text = `Fetching stale issues (no activity for ${staleDays}+ days)…`;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - staleDays);

  const issues = await listRecentIssuesAsync({
    state: 'open',
    labels: labelFilter,
    sort: 'updated',
    direction: 'asc',
    per_page: 100,
  });

  return issues.filter((i) => isIssue(i) && new Date(i.updated_at) < threshold);
}

async function fetchExternalPRs(spinner?: ora.Ora): Promise<PRWithReviews[]> {
  if (spinner) spinner.text = 'Fetching external PRs awaiting review…';
  const prs = await listOpenPullRequestsAsync({ per_page: 100 });
  const external = prs.filter((pr) => pr.head.repo?.full_name !== 'expo/expo');

  return batchAsync(external.slice(0, 50), 10, async (pr) => {
    try {
      const reviews = await listPullRequestReviewsAsync(pr.number);
      return { pr, reviews };
    } catch {
      return { pr, reviews: [] as { state?: string }[] };
    }
  });
}

function waitForKey(validKeys: string[]): Promise<string> {
  return new Promise((resolve) => {
    const { stdin } = process;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (data: string) => {
      // Ctrl+C
      if (data === '\u0003') {
        stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.exit(0);
      }

      // Arrow keys and escape
      let key: string;
      if (data === '\u001b[A') {
        key = 'up';
      } else if (data === '\u001b[B') {
        key = 'down';
      } else if (data === '\u001b' || data === '\u001b\u001b') {
        key = 'escape';
      } else if (data === '\r' || data === '\n') {
        key = 'enter';
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

function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

type QueueItem = {
  number: number;
  title: string;
  author: string;
  category: string;
  isPR: boolean;
};

type CategoryInfo = {
  key: string;
  label: string;
  guidance: string;
  items: QueueItem[];
};

function buildCategories(data: DashboardData): CategoryInfo[] {
  const categories: CategoryInfo[] = [];

  // Priority 1: "needs review, unassigned" — newest first
  const nrSorted = [...data.needsReviewUnassigned].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  if (nrSorted.length > 0) {
    categories.push({
      key: 'needs-review',
      label: 'Needs Review — Unassigned',
      guidance:
        'On-call owns these. Timebox ~10 min per issue: verify validity, identify module/area, ' +
        'then move to "issue accepted" + assign owner, or assign module lead and summarize findings.',
      items: nrSorted.map((i) => ({
        number: i.number,
        title: i.title,
        author: i.user?.login ?? '-',
        category: 'Needs Review — Unassigned',
        isPR: false,
      })),
    });
  }

  // Priority 2: Unresponded issues — oldest first
  const unrespondedSorted = [...data.unresponded].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  if (unrespondedSorted.length > 0) {
    categories.push({
      key: 'unresponded',
      label: 'Unresponded Issues',
      guidance:
        'New issues with no team response yet. Add an initial reply acknowledging the report, ' +
        'ask for reproduction steps if missing, and apply appropriate labels.',
      items: unrespondedSorted.map((i) => ({
        number: i.number,
        title: i.title,
        author: i.user?.login ?? '-',
        category: 'Unresponded Issue',
        isPR: false,
      })),
    });
  }

  // Priority 3: "issue accepted, unassigned" — oldest first
  const acceptedSorted = [...data.acceptedUnassigned].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  if (acceptedSorted.length > 0) {
    categories.push({
      key: 'accepted',
      label: 'Accepted — Unassigned',
      guidance:
        'These issues are validated but have no owner. Locate their Linear tasks and ensure ' +
        'they are assigned to the appropriate module lead.',
      items: acceptedSorted.map((i) => ({
        number: i.number,
        title: i.title,
        author: i.user?.login ?? '-',
        category: 'Accepted — Unassigned',
        isPR: false,
      })),
    });
  }

  // Priority 4: External PRs with no reviews — oldest first
  const unreviewedPRs = data.externalPRs
    .filter((p) => p.reviews.length === 0)
    .sort((a, b) => new Date(a.pr.created_at).getTime() - new Date(b.pr.created_at).getTime());
  if (unreviewedPRs.length > 0) {
    categories.push({
      key: 'external-prs',
      label: 'External PRs — No Reviews',
      guidance:
        'Community contributions waiting for a first review. Check code quality, test coverage, ' +
        'and alignment with project standards. A quick comment goes a long way.',
      items: unreviewedPRs.map((p) => ({
        number: p.pr.number,
        title: p.pr.title,
        author: p.pr.user?.login ?? '-',
        category: 'External PR — No Reviews',
        isPR: true,
      })),
    });
  }

  // Priority 5: Stale issues — oldest first
  const staleSorted = [...data.stale].sort(
    (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  );
  if (staleSorted.length > 0) {
    categories.push({
      key: 'stale',
      label: 'Stale Issues',
      guidance:
        `No activity for ${data.staleDays}+ days. Consider closing if no longer relevant, ` +
        'requesting an update from the reporter, or bumping priority if still valid.',
      items: staleSorted.map((i) => ({
        number: i.number,
        title: i.title,
        author: i.user?.login ?? '-',
        category: 'Stale Issue',
        isPR: false,
      })),
    });
  }

  return categories;
}

function showCompactStatus(weekNum: number, weekFriday: Date, categories: CategoryInfo[]): void {
  const startStr = getMondayOfWeek(weekNum, new Date().getFullYear()).toISOString().slice(0, 10);
  const endStr = weekFriday.toISOString().slice(0, 10);

  logger.info('');
  logger.info(chalk.bold(`GitHub Inspect — Week ${weekNum} (${startStr} → ${endStr})`));
  logger.info('');

  if (categories.length === 0) {
    logger.info('  No actionable items. All clear!');
    logger.info('');
    return;
  }

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
  logger.info(`  ${totalItems} items across ${categories.length} categories.`);
  logger.info('');
}

async function fetchAllData(
  options: ActionOptions,
  spinner?: ora.Ora
): Promise<{ data: DashboardData; weekNum: number; weekFriday: Date }> {
  const [startDate, endDate, weekNum, weekFriday] = parseDateRange(options.week);
  const staleDays = parseInt(options.staleDays ?? '14', 10);

  const { unassigned: needsReviewUnassigned, assigned: needsReviewAssigned } =
    await fetchNeedsReviewIssues(options.label, spinner);
  const acceptedUnassigned = await fetchAcceptedUnassigned(options.label, spinner);
  const unresponded = await fetchUnrespondedIssues(startDate, endDate, options.label, spinner);
  const stale = await fetchStaleIssues(staleDays, options.label, spinner);
  const externalPRs = await fetchExternalPRs(spinner);

  return {
    data: {
      needsReviewUnassigned,
      needsReviewAssigned,
      acceptedUnassigned,
      unresponded,
      stale,
      externalPRs,
      staleDays,
    },
    weekNum,
    weekFriday,
  };
}

function showItemHeader(item: QueueItem, index: number, total: number, selected: boolean): void {
  const prefix = selected ? chalk.green('\u25b6') : ' ';
  const num = chalk.cyan(`#${item.number}`);
  const title = truncate(item.title, 60);
  const author = chalk.dim(item.author);
  const pos = chalk.gray(`${index + 1}/${total}`);
  logger.info(`  ${prefix} ${pos} ${num} ${title} ${author}`);
}

function showCategoryList(categories: CategoryInfo[], selectedIndex: number): void {
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const prefix = i === selectedIndex ? chalk.green('\u25b6') : ' ';
    const recommended = i === 0 ? chalk.bgGreen.black(' RECOMMENDED ') + ' ' : '';
    logger.info(
      `  ${prefix} ${chalk.green(`${i + 1}.`)} ${recommended}${chalk.bold(cat.label)} ${chalk.cyan(`(${cat.items.length})`)}`
    );
    logger.info(chalk.dim(`       ${cat.guidance}`));
    logger.info('');
  }
  logger.info(chalk.gray('  \u2191\u2193 navigate / Enter select / Esc quit'));
}

const MAX_VISIBLE_ITEMS = 15;

function getScrollWindow(total: number, selectedIndex: number): { start: number; end: number } {
  if (total <= MAX_VISIBLE_ITEMS) {
    return { start: 0, end: total };
  }
  // Keep selected item roughly centered
  let start = selectedIndex - Math.floor(MAX_VISIBLE_ITEMS / 2);
  start = Math.max(0, Math.min(start, total - MAX_VISIBLE_ITEMS));
  return { start, end: start + MAX_VISIBLE_ITEMS };
}

function showItemList(category: CategoryInfo, selectedIndex: number): void {
  const total = category.items.length;
  const { start, end } = getScrollWindow(total, selectedIndex);

  logger.info(chalk.bold(category.label));
  logger.info(chalk.dim(`  ${category.guidance}`));
  logger.info('');

  if (start > 0) {
    logger.info(chalk.gray(`  \u25b2 ${start} more above`));
  }

  for (let i = start; i < end; i++) {
    showItemHeader(category.items[i], i, total, i === selectedIndex);
  }

  if (end < total) {
    logger.info(chalk.gray(`  \u25bc ${total - end} more below`));
  }

  logger.info('');
  logger.info(chalk.gray('  \u2191\u2193 navigate / Enter expand / Esc back'));
}

function clearLines(count: number): void {
  for (let i = 0; i < count; i++) {
    process.stdout.write('\x1b[1A\x1b[2K');
  }
}

function categoryLineCount(categories: CategoryInfo[]): number {
  // Each category: prefix line + guidance line + blank line, plus the hint line
  return categories.length * 3 + 1;
}

function itemListLineCount(category: CategoryInfo, selectedIndex: number): number {
  const total = category.items.length;
  const { start, end } = getScrollWindow(total, selectedIndex);
  const visibleItems = end - start;
  const hasAbove = start > 0 ? 1 : 0;
  const hasBelow = end < total ? 1 : 0;
  // Title + guidance + blank + above? + items + below? + blank + hint
  return 3 + hasAbove + visibleItems + hasBelow + 2;
}

async function interactiveDashboard(options: ActionOptions, spinner: ora.Ora) {
  let { data, weekNum, weekFriday } = await fetchAllData(options, spinner);
  spinner.stop();
  let categories = buildCategories(data);
  showCompactStatus(weekNum, weekFriday, categories);

  if (categories.length === 0) {
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

      // Item browsing within category
      let itemIndex = 0;
      showItemList(selectedCategory, itemIndex);

      let lastLineCount = itemListLineCount(selectedCategory, itemIndex);
      let backToCategories = false;
      while (true) {
        const itemKey = await waitForKey(['up', 'down', 'enter', 'escape', 'r']);

        if (itemKey === 'escape') {
          clearLines(lastLineCount);
          backToCategories = true;
          break;
        } else if (itemKey === 'up') {
          if (itemIndex > 0) {
            clearLines(lastLineCount);
            itemIndex--;
            showItemList(selectedCategory, itemIndex);
            lastLineCount = itemListLineCount(selectedCategory, itemIndex);
          }
        } else if (itemKey === 'down') {
          if (itemIndex < selectedCategory.items.length - 1) {
            clearLines(lastLineCount);
            itemIndex++;
            showItemList(selectedCategory, itemIndex);
            lastLineCount = itemListLineCount(selectedCategory, itemIndex);
          }
        } else if (itemKey === 'enter') {
          clearLines(lastLineCount);
          const item = selectedCategory.items[itemIndex];

          await showDetailInteractive(item);

          // Re-show item list
          showItemList(selectedCategory, itemIndex);
          lastLineCount = itemListLineCount(selectedCategory, itemIndex);
        } else if (itemKey === 'r') {
          clearLines(lastLineCount);
          const reloadSpinner = ora('Reloading data from GitHub…').start();
          const reloaded = await fetchAllData(options, reloadSpinner);
          reloadSpinner.stop();
          data = reloaded.data;
          weekNum = reloaded.weekNum;
          weekFriday = reloaded.weekFriday;
          categories = buildCategories(data);
          showCompactStatus(weekNum, weekFriday, categories);
          if (categories.length === 0) {
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

function formatLabels(item: { labels: IssueItem['labels'] }): string {
  return (
    getLabels(item)
      .map((l) => l.name)
      .join(', ') || '-'
  );
}

type DetailData = {
  isPR: boolean;
  number: number;
  url: string;
  title: string;
  state: string;
  author: string;
  labels: string;
  created: string;
  updated: string;
  comments: number;
  body: string | null;
  // PR-specific
  branch?: string;
  mergeable?: string;
  diffStats?: string;
  reviews?: { login: string; state: string; date: string }[];
  // Issue-specific
  reproLinks?: string[];
  referencedIssues?: string[];
  closedBy?: string;
};

async function fetchDetailData(item: QueueItem): Promise<DetailData> {
  const issue = await getIssueAsync(item.number);
  const isPR = item.isPR || ('pull_request' in issue && !!issue.pull_request);

  const base: DetailData = {
    isPR,
    number: issue.number,
    url: issue.html_url,
    title: issue.title,
    state: issue.state ?? 'open',
    author: issue.user?.login ?? '-',
    labels: formatLabels(issue),
    created: issue.created_at,
    updated: issue.updated_at,
    comments: issue.comments,
    body: issue.body ?? null,
  };

  if (isPR) {
    const pr = await getPullRequestAsync(issue.number);
    base.branch = `${pr.base.ref} \u2190 ${pr.head.ref}`;
    base.mergeable = String(pr.mergeable ?? 'unknown');
    base.diffStats = `${chalk.green(`+${pr.additions}`)} ${chalk.red(`-${pr.deletions}`)} in ${pr.changed_files} files`;
    try {
      const reviews = await listPullRequestReviewsAsync(pr.number);
      base.reviews = reviews.map((r) => ({
        login: r.user?.login ?? '-',
        state: r.state ?? '-',
        date: r.submitted_at ? new Date(r.submitted_at).toISOString().slice(0, 10) : '-',
      }));
    } catch {
      base.reviews = [];
    }
  } else {
    // Reproduction links
    if (issue.body) {
      const urls = issue.body.match(/https?:\/\/(snack\.expo\.dev|github\.com)\/[^\s)]+/g);
      if (urls && urls.length > 0) base.reproLinks = urls;
      const refs = [...new Set(issue.body.match(/#(\d{4,6})/g) ?? [])];
      if (refs.length > 0) base.referencedIssues = refs;
    }
    if (issue.state === 'closed') {
      try {
        const closerUrl = await getIssueCloserPrUrlAsync(issue.number);
        if (closerUrl) base.closedBy = closerUrl;
      } catch {
        // ignore
      }
    }
  }

  return base;
}

type Comment = Awaited<ReturnType<typeof listAllCommentsAsync>>[number];

async function analyzeIssueAsync(detail: DetailData, comments: Comment[]): Promise<string> {
  const authenticated = await isAuthenticatedAsync();
  if (!authenticated) {
    return 'Unblocked API not configured. Set UNBLOCKED_API_KEY env var.';
  }

  const type = detail.isPR ? 'PR' : 'issue';
  const bodySnippet = detail.body ? truncate(detail.body, 2000) : '(no body)';

  let prompt = `Analyze this GitHub ${type}.\n\n`;
  prompt += `Number: #${detail.number}\n`;
  prompt += `Title: ${detail.title}\n`;
  prompt += `State: ${detail.state}\n`;
  prompt += `Author: ${detail.author}\n`;
  prompt += `Labels: ${detail.labels}\n`;
  prompt += `Created: ${detail.created}\n`;
  prompt += `Updated: ${detail.updated}\n`;

  if (detail.isPR) {
    if (detail.branch) prompt += `Branch: ${detail.branch}\n`;
    if (detail.diffStats) prompt += `Diff: ${detail.diffStats}\n`;
    if (detail.reviews && detail.reviews.length > 0) {
      prompt += `Reviews:\n`;
      for (const r of detail.reviews) {
        prompt += `  - ${r.login}: ${r.state} (${r.date})\n`;
      }
    }
  }

  prompt += `\nBody:\n${bodySnippet}\n`;

  const recentComments = comments.slice(-10);
  if (recentComments.length > 0) {
    prompt += `\nRecent comments (${recentComments.length} of ${comments.length}):\n`;
    for (const c of recentComments) {
      const badge = isTeamResponse(c) ? '[TEAM]' : '[EXTERNAL]';
      const date = new Date(c.created_at).toISOString().slice(0, 10);
      prompt += `\n${badge} ${c.user?.login ?? '-'} (${date}):\n${truncate(c.body ?? '', 500)}\n`;
    }
  }

  prompt += `\nAs an on-call engineer assistant, please:`;
  prompt += `\n1. Summarize the problem and current status.`;
  prompt += `\n2. Search for duplicate or related issues that report the same problem — link them if found.`;
  prompt += `\n3. Check if this is a known issue with an existing fix, workaround, or relevant PR.`;
  prompt += `\n4. Recommend what action the on-call engineer should take next.`;
  prompt += `\n5. Flag whether this needs urgent attention.`;
  prompt += `\nBe concise. Always include links to duplicates, related issues, or solutions if you find any.`;

  const answer = await askQuestionAsync(prompt);

  if (answer.state === 'failed') {
    return 'Analysis failed — Unblocked returned an error.';
  }

  let result = answer.answer ?? 'No analysis returned.';
  if (answer.references && answer.references.length > 0) {
    result += '\n\nReferences:';
    for (const ref of answer.references) {
      result += `\n  ${ref.htmlUrl}`;
    }
  }
  return result;
}

function renderDetailView(
  detail: DetailData,
  showBody: boolean,
  showComments: boolean,
  analysisText: string | null = null
): string[] {
  const lines: string[] = [];
  const type = detail.isPR ? 'PR' : 'Issue';

  lines.push(chalk.bold(`=== ${type} #${detail.number} ===`));
  lines.push(`  URL:     ${chalk.blue(detail.url)}`);
  lines.push(`  Title:   ${detail.title}`);
  lines.push(`  State:   ${detail.state}`);
  lines.push(`  Author:  ${detail.author}`);
  lines.push(`  Labels:  ${detail.labels}`);
  lines.push(`  Created: ${detail.created}`);
  lines.push(`  Updated: ${detail.updated}`);

  if (detail.isPR) {
    lines.push(`  Branch:  ${detail.branch}`);
    lines.push(`  Merge:   ${detail.mergeable}`);
    lines.push(`  Diff:    ${detail.diffStats}`);
    if (detail.reviews && detail.reviews.length > 0) {
      lines.push('');
      lines.push(chalk.bold('  Reviews:'));
      for (const r of detail.reviews) {
        const color =
          r.state === 'APPROVED'
            ? chalk.green
            : r.state === 'CHANGES_REQUESTED'
              ? chalk.red
              : chalk.gray;
        lines.push(`    ${chalk.dim(r.login)} — ${color(r.state)} (${r.date})`);
      }
    }
  } else {
    if (detail.reproLinks) {
      lines.push('');
      lines.push(chalk.bold('  Repro links:'));
      for (const url of detail.reproLinks) lines.push(`    ${chalk.blue(url)}`);
    }
    if (detail.referencedIssues) {
      lines.push(`  Refs:    ${detail.referencedIssues.join(' ')}`);
    }
    if (detail.closedBy) {
      lines.push(`  Closed:  ${chalk.blue(detail.closedBy)}`);
    }
  }

  if (showBody) {
    lines.push('');
    lines.push(chalk.bold('  --- Body ---'));
    if (detail.body) {
      for (const line of truncate(detail.body, 800).split('\n')) {
        lines.push(`  ${line}`);
      }
    } else {
      lines.push(chalk.gray('  (no body)'));
    }
  }

  if (showComments) {
    lines.push('');
    lines.push(chalk.bold(`  --- Comments (${detail.comments}) ---`));
    // Comments are loaded asynchronously, rendered separately
    lines.push(chalk.gray('  Loading...'));
  }

  if (analysisText) {
    lines.push('');
    lines.push(chalk.bold('  --- AI Analysis ---'));
    for (const line of analysisText.split('\n')) {
      lines.push(`  ${line}`);
    }
  }

  lines.push('');

  // Hint line
  const bodyToggle = showBody ? chalk.yellow('(b)ody') : chalk.green('(b)ody');
  const commentsLabel = `(c)omments (${detail.comments})`;
  const commentsToggle = showComments ? chalk.yellow(commentsLabel) : chalk.green(commentsLabel);
  const analyzeToggle = analysisText ? chalk.yellow('(a)nalyze') : chalk.green('(a)nalyze');
  const parts = [bodyToggle, commentsToggle, analyzeToggle, chalk.gray('Esc back')];
  lines.push(chalk.gray('  ') + parts.join(chalk.gray(' / ')));

  return lines;
}

async function showDetailInteractive(item: QueueItem): Promise<void> {
  logger.info(chalk.gray('  Loading...'));
  const detail = await fetchDetailData(item);
  clearLines(1); // remove "Loading..."

  let showBody = false;
  let showComments = false;
  let showAnalysis = false;
  let commentLines: string[] | null = null;
  let rawComments: Comment[] | null = null;
  let analysisText: string | null = null;
  let lastRenderedCount = 0;

  const render = () => {
    if (lastRenderedCount > 0) clearLines(lastRenderedCount);

    const lines = renderDetailView(
      detail,
      showBody,
      showComments,
      showAnalysis ? analysisText : null
    );

    // Replace "Loading..." placeholders with cached content
    if (showComments && commentLines) {
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes('Comments') &&
          i + 1 < lines.length &&
          lines[i + 1].includes('Loading...')
        ) {
          lines.splice(i + 1, 1, ...commentLines);
          break;
        }
      }
    }

    for (const line of lines) logger.info(line);
    lastRenderedCount = lines.length;
  };

  render();

  const validKeys = ['escape', 'b', 'c', 'a'];

  while (true) {
    const key = await waitForKey(validKeys);

    if (key === 'escape') {
      if (showBody || showComments || showAnalysis) {
        showBody = false;
        showComments = false;
        showAnalysis = false;
        render();
      } else {
        clearLines(lastRenderedCount);
        return;
      }
    } else if (key === 'b') {
      showBody = !showBody;
      render();
    } else if (key === 'c') {
      showComments = !showComments;
      if (showComments && !commentLines) {
        render(); // show "Loading..."
        const comments = detail.comments > 0 ? await listAllCommentsAsync(detail.number) : [];
        rawComments = comments;
        commentLines = [];
        if (comments.length === 0) {
          commentLines.push(chalk.gray('  No comments.'));
        } else {
          for (const comment of comments) {
            const badge = isTeamResponse(comment) ? chalk.green('[TEAM]') : chalk.gray('[EXT]');
            const date = new Date(comment.created_at).toISOString().slice(0, 10);
            commentLines.push(`  ${badge} ${chalk.dim(comment.user?.login ?? '-')} (${date})`);
            commentLines.push(`    ${truncate(comment.body ?? '', 300)}`);
            commentLines.push('');
          }
        }
      }
      render();
    } else if (key === 'a') {
      showAnalysis = !showAnalysis;
      if (showAnalysis && !analysisText) {
        // Ensure we have raw comments loaded
        if (!rawComments) {
          rawComments = detail.comments > 0 ? await listAllCommentsAsync(detail.number) : [];
        }
        if (lastRenderedCount > 0) clearLines(lastRenderedCount);
        lastRenderedCount = 0;
        const analyzeSpinner = ora('Analyzing with Unblocked…').start();
        try {
          analysisText = await analyzeIssueAsync(detail, rawComments);
          analyzeSpinner.stop();
        } catch (err: any) {
          analyzeSpinner.stop();
          analysisText = `Analysis error: ${err.message ?? err}`;
        }
      }
      render();
    }
  }
}

async function action(options: ActionOptions) {
  const spinner = ora('Authenticating…').start();

  // Auth check
  try {
    await getAuthenticatedUserAsync();
  } catch {
    spinner.fail('GitHub authentication failed. Set the GITHUB_TOKEN environment variable.');
    process.exit(1);
  }

  if (!(await isAuthenticatedAsync())) {
    spinner.stop();
    logger.warn(chalk.yellow('Unblocked API not configured — (a)nalyze will be unavailable.'));
    const shouldSetup = await promptYesNo('Set up Unblocked API key now?');
    if (shouldSetup) {
      await authenticateAsync();
      const key = await promptInput('Paste your API token:');
      if (key) {
        setApiKey(key.trim());
        if (await isAuthenticatedAsync()) {
          logger.info(chalk.green('Unblocked authenticated successfully.'));
        } else {
          logger.warn(chalk.yellow('Token appears invalid — (a)nalyze will be unavailable.'));
        }
      }
    }
    spinner.start();
  }

  await interactiveDashboard(options, spinner);
}

export default (program: Command) => {
  program
    .command('github-inspect')
    .alias('gi', 'ghi')
    .description(
      'Interactive GitHub dashboard for SDK support on-call. ' +
        'Browse issues needing review, unresponded issues, stale issues, and external PRs.'
    )
    .option(
      '-w, --week <week>',
      'ISO week number (1-53), or "last"/"prev" for previous week. Defaults to current week.'
    )
    .option('-l, --label <label>', 'Filter by GitHub label.')
    .option('-s, --stale-days <days>', 'Custom stale threshold in days (default: 14).')
    .asyncAction(action);
};
