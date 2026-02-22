import { Command } from '@expo/commander';
import chalk from 'chalk';

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

// --- Types ---

type ActionOptions = {
  week?: string;
  inspect?: string;
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

// --- Helpers ---

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

function ageDays(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function formatAge(date: Date | string): string {
  const days = ageDays(date);
  if (days < 1) return '<1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

function extractArea(labels: { name?: string }[]): string {
  for (const label of labels) {
    const name = label.name ?? '';
    const moduleMatch = name.match(/^Module:\s*(.+)/i);
    if (moduleMatch) return moduleMatch[1];
    const pkgMatch = name.match(/^packages\/(.+)/i);
    if (pkgMatch) return pkgMatch[1];
  }
  return '-';
}

function summarizeReviews(reviews: { state?: string }[]): string {
  if (reviews.length === 0) return 'no reviews';
  const approved = reviews.filter((r) => r.state === 'APPROVED').length;
  const changesRequested = reviews.filter((r) => r.state === 'CHANGES_REQUESTED').length;
  if (changesRequested > 0) return chalk.red(`changes requested (${changesRequested})`);
  if (approved > 0) return chalk.green(`${approved} approved`);
  return `${reviews.length} review(s)`;
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + '…';
}

const MAX_ITEMS = 30;

// --- Display helpers ---

type Column<T> = {
  label: string;
  width: number;
  value: (item: T) => string;
  color?: (val: string) => string;
};

function displayTable<T>(
  title: string,
  items: T[],
  columns: Column<T>[],
  emptyMessage = '  No items found.'
): void {
  logger.info('');
  logger.info(chalk.bold.underline(title));
  if (items.length === 0) {
    logger.info(chalk.gray(emptyMessage));
    return;
  }

  const display = items.slice(0, MAX_ITEMS);
  const header = columns.map((c) => chalk.gray(c.label.padEnd(c.width))).join(' ');
  logger.info(`  ${header}`);
  for (const item of display) {
    const row = columns
      .map((c) => {
        const val = c.value(item).padEnd(c.width);
        return c.color ? c.color(val) : val;
      })
      .join(' ');
    logger.info(`  ${row}`);
  }
  if (items.length > MAX_ITEMS) {
    logger.info(chalk.gray(`  ... and ${items.length - MAX_ITEMS} more`));
  }
}

// --- Batch helper ---

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

// --- Dashboard sections ---

// --- Issue column definitions (reused across sections) ---

const issueColumns: Column<IssueItem>[] = [
  { label: '#', width: 7, value: (i) => `#${i.number}`, color: chalk.cyan },
  { label: 'Title', width: 52, value: (i) => truncate(i.title, 50) },
  {
    label: 'Author',
    width: 18,
    value: (i) => truncate(i.user?.login ?? '-', 16),
    color: chalk.dim,
  },
  { label: 'Age', width: 6, value: (i) => formatAge(i.created_at) },
  { label: 'Area', width: 0, value: (i) => extractArea(getLabels(i)), color: chalk.yellow },
];

const assignedIssueColumns: Column<IssueItem>[] = [
  { label: '#', width: 7, value: (i) => `#${i.number}`, color: chalk.cyan },
  { label: 'Title', width: 42, value: (i) => truncate(i.title, 40) },
  {
    label: 'Assignee',
    width: 18,
    value: (i) => truncate((i.assignees ?? []).map((a: any) => a.login).join(', ') || '-', 16),
    color: chalk.dim,
  },
  { label: 'Age', width: 6, value: (i) => formatAge(i.created_at) },
  { label: 'Area', width: 0, value: (i) => extractArea(getLabels(i)), color: chalk.yellow },
];

// --- Dashboard sections ---

async function fetchNeedsReviewIssues(
  labelFilter?: string
): Promise<{ unassigned: IssueItem[]; assigned: IssueItem[] }> {
  logger.info(chalk.gray('Fetching issues with "needs review" label...'));
  const labels = labelFilter ? `needs review,${labelFilter}` : 'needs review';
  const issues = await listAllOpenIssuesAsync({ labels, limit: 100 });
  const filtered = issues.filter(isIssue);
  return {
    unassigned: filtered.filter((i) => !isAssigned(i)),
    assigned: filtered.filter((i) => isAssigned(i)),
  };
}

async function fetchAcceptedUnassigned(labelFilter?: string): Promise<IssueItem[]> {
  logger.info(chalk.gray('Fetching "issue accepted" issues without assignee...'));
  const labels = labelFilter ? `issue accepted,${labelFilter}` : 'issue accepted';
  const issues = await listAllOpenIssuesAsync({ labels, limit: 100 });
  return issues.filter((i) => isIssue(i) && !isAssigned(i));
}

function displayNeedsReviewIssues(unassigned: IssueItem[], assigned: IssueItem[]): void {
  // Newest first per runbook
  const sorted = [...unassigned].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  displayTable('Needs Review — Unassigned (on-call owns these)', sorted, issueColumns);
  displayTable('Needs Review — Assigned (owned by assignee)', assigned, assignedIssueColumns);
}

function displayAcceptedUnassigned(items: IssueItem[]): void {
  displayTable('Issue Accepted — Unassigned (needs Linear task follow-up)', items, issueColumns);
}

async function fetchUnrespondedIssues(
  startDate: Date,
  endDate: Date,
  labelFilter?: string
): Promise<IssueItem[]> {
  logger.info(chalk.gray('Fetching new/unresponded issues...'));
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

function displayUnrespondedIssues(unresponded: IssueItem[]): void {
  displayTable('New/Unresponded Issues', unresponded, [
    { label: '#', width: 7, value: (i) => `#${i.number}`, color: chalk.cyan },
    { label: 'Title', width: 52, value: (i) => truncate(i.title, 50) },
    {
      label: 'Author',
      width: 18,
      value: (i) => truncate(i.user?.login ?? '-', 16),
      color: chalk.dim,
    },
    {
      label: 'Created',
      width: 12,
      value: (i) => new Date(i.created_at).toISOString().slice(0, 10),
    },
    { label: 'Comments', width: 0, value: (i) => String(i.comments) },
  ]);
}

async function fetchStaleIssues(staleDays: number, labelFilter?: string): Promise<IssueItem[]> {
  logger.info(chalk.gray(`Fetching stale issues (no activity for ${staleDays}+ days)...`));
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

function displayStaleIssues(stale: IssueItem[]): void {
  displayTable('Stale Issues', stale, [
    { label: '#', width: 7, value: (i) => `#${i.number}`, color: chalk.cyan },
    { label: 'Title', width: 52, value: (i) => truncate(i.title, 50) },
    {
      label: 'Last Activity',
      width: 14,
      value: (i) => new Date(i.updated_at).toISOString().slice(0, 10),
    },
    { label: 'Days', width: 6, value: (i) => String(ageDays(i.updated_at)), color: chalk.red },
    { label: 'Area', width: 0, value: (i) => extractArea(getLabels(i)), color: chalk.yellow },
  ]);
}

async function fetchExternalPRs(): Promise<PRWithReviews[]> {
  logger.info(chalk.gray('Fetching external PRs awaiting review...'));
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

function displayExternalPRs(prsWithReviews: PRWithReviews[]): void {
  displayTable('External PRs Awaiting Review', prsWithReviews, [
    { label: '#', width: 7, value: (p) => `#${p.pr.number}`, color: chalk.cyan },
    { label: 'Title', width: 52, value: (p) => truncate(p.pr.title, 50) },
    {
      label: 'Author',
      width: 18,
      value: (p) => truncate(p.pr.user?.login ?? '-', 16),
      color: chalk.dim,
    },
    { label: 'Age', width: 6, value: (p) => formatAge(p.pr.created_at) },
    { label: 'Review Status', width: 0, value: (p) => summarizeReviews(p.reviews) },
  ]);
}

// --- Suggestions engine ---

function showSuggestions(data: DashboardData): void {
  const suggestions: { priority: number; icon: string; text: string }[] = [];

  // --- Priority 1: "needs review, unassigned" — on-call owns these (newest first per runbook) ---
  if (data.needsReviewUnassigned.length > 0) {
    const newest = [...data.needsReviewUnassigned].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    suggestions.push({
      priority: 1,
      icon: '>>',
      text:
        `Triage ${data.needsReviewUnassigned.length} "needs review" unassigned issue(s), newest first. ` +
        `Start with #${newest.number} — ${chalk.cyan(`et gi --inspect ${newest.number}`)}`,
    });
    suggestions.push({
      priority: 1,
      icon: '  ',
      text:
        chalk.dim('Timebox ~10 min per issue: verify validity, identify module/area, ') +
        chalk.dim(
          'then move to "issue accepted" + assign owner, or assign module lead and summarize findings.'
        ),
    });
  }

  // --- Priority 2: Unresponded issues (opened this week, no team reply yet) ---
  if (data.unresponded.length > 0) {
    const oldest = data.unresponded.reduce((a, b) =>
      new Date(a.created_at) < new Date(b.created_at) ? a : b
    );
    const age = ageDays(oldest.created_at);
    suggestions.push({
      priority: 2,
      icon: '>>',
      text:
        `Respond to ${data.unresponded.length} new issue(s) with no team response. ` +
        `Oldest: #${oldest.number} (${age}d) — ${chalk.cyan(`et gi --inspect ${oldest.number}`)}`,
    });
  }

  // --- Priority 3: "issue accepted, unassigned" — needs Linear task follow-up ---
  if (data.acceptedUnassigned.length > 0) {
    const oldest = data.acceptedUnassigned.reduce((a, b) =>
      new Date(a.created_at) < new Date(b.created_at) ? a : b
    );
    suggestions.push({
      priority: 3,
      icon: '>>',
      text:
        `${data.acceptedUnassigned.length} accepted issue(s) have no assignee — ` +
        `locate their Linear tasks and ensure they are assigned to the appropriate lead. ` +
        `Start with #${oldest.number} — ${chalk.cyan(`et gi --inspect ${oldest.number}`)}`,
    });
  }

  // --- Priority 4: External PRs with no reviews (community contributions) ---
  const unreviewed = data.externalPRs.filter((p) => p.reviews.length === 0);
  if (unreviewed.length > 0) {
    const oldest = unreviewed.reduce((a, b) =>
      new Date(a.pr.created_at) < new Date(b.pr.created_at) ? a : b
    );
    const age = ageDays(oldest.pr.created_at);
    suggestions.push({
      priority: 4,
      icon: '>>',
      text:
        `Review ${unreviewed.length} community PR(s) with no reviews. ` +
        `Start with #${oldest.pr.number} (${age}d) — ${chalk.cyan(`et gi --inspect ${oldest.pr.number}`)}`,
    });
  }

  // External PRs with changes requested (author may have addressed feedback)
  const changesRequested = data.externalPRs.filter((p) =>
    p.reviews.some((r) => r.state === 'CHANGES_REQUESTED')
  );
  if (changesRequested.length > 0) {
    suggestions.push({
      priority: 4,
      icon: '  ',
      text: `${changesRequested.length} external PR(s) have "changes requested" — check if authors addressed feedback.`,
    });
  }

  // --- Priority 5: "needs review, assigned" — informational only ---
  if (data.needsReviewAssigned.length > 0) {
    suggestions.push({
      priority: 5,
      icon: '  ',
      text: chalk.dim(
        `${data.needsReviewAssigned.length} "needs review" issue(s) are assigned — no action needed unless explicitly requested.`
      ),
    });
  }

  // --- Priority 6: Stale issues (housekeeping) ---
  if (data.stale.length > 0) {
    const veryStale = data.stale.filter((i) => ageDays(i.updated_at) > data.staleDays * 2);
    if (veryStale.length > 0) {
      suggestions.push({
        priority: 6,
        icon: '  ',
        text: `${veryStale.length} issue(s) stale for ${data.staleDays * 2}+ days — consider closing or requesting updates.`,
      });
    }
    if (data.stale.length > veryStale.length) {
      suggestions.push({
        priority: 6,
        icon: '  ',
        text: `${data.stale.length - veryStale.length} more issue(s) approaching stale threshold — triage when time permits.`,
      });
    }
  }

  // --- Area hotspots: identify modules with the most open items ---
  const areaCounts = new Map<string, number>();
  const allIssues = [
    ...data.needsReviewUnassigned,
    ...data.acceptedUnassigned,
    ...data.unresponded,
    ...data.stale,
  ];
  for (const issue of allIssues) {
    const area = extractArea(getLabels(issue));
    if (area !== '-') {
      areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
    }
  }
  const hotspots = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (hotspots.length > 0 && hotspots[0][1] >= 3) {
    const hotspotStr = hotspots.map(([area, count]) => `${area} (${count})`).join(', ');
    suggestions.push({
      priority: 7,
      icon: '  ',
      text: `Area hotspots: ${hotspotStr} — consider focused triage with ${chalk.cyan(`et gi --label "Module: <name>"`)}`,
    });
  }

  // --- All clear ---
  if (suggestions.length === 0) {
    suggestions.push({
      priority: 99,
      icon: '  ',
      text: 'No urgent items. Good time to review open issues for quick wins or obvious follow-ups.',
    });
  }

  // Render — only action items (>>) get numbered; sub-items are indented continuations
  logger.info('');
  logger.info(chalk.bold.underline('Suggested Next Steps'));
  suggestions.sort((a, b) => a.priority - b.priority);
  let stepNum = 0;
  for (const s of suggestions) {
    if (s.icon === '>>') {
      stepNum++;
      logger.info(`  ${chalk.green('>>')} ${stepNum}. ${s.text}`);
    } else {
      logger.info(`        ${s.text}`);
    }
  }
}

// --- Dashboard orchestrator ---

async function showDashboard(options: ActionOptions) {
  const [startDate, endDate, weekNum, weekFriday] = parseDateRange(options.week);
  const staleDays = parseInt(options.staleDays ?? '14', 10);
  const today = new Date().toISOString().slice(0, 10);

  logger.info(
    chalk.bold(
      `GitHub Inspect Dashboard — Week ${weekNum} (${startDate.toISOString().slice(0, 10)} → ${weekFriday.toISOString().slice(0, 10)})`
    )
  );
  logger.info(chalk.gray(`Today: ${today}`));
  logger.info('');

  // Fetch all data
  const { unassigned: needsReviewUnassigned, assigned: needsReviewAssigned } =
    await fetchNeedsReviewIssues(options.label);
  const acceptedUnassigned = await fetchAcceptedUnassigned(options.label);
  const unresponded = await fetchUnrespondedIssues(startDate, endDate, options.label);
  const stale = await fetchStaleIssues(staleDays, options.label);
  const externalPRs = await fetchExternalPRs();

  // Display sections
  displayNeedsReviewIssues(needsReviewUnassigned, needsReviewAssigned);
  displayAcceptedUnassigned(acceptedUnassigned);
  displayUnrespondedIssues(unresponded);
  displayStaleIssues(stale);
  displayExternalPRs(externalPRs);

  // Summary
  logger.info('');
  logger.info(chalk.bold('Summary'));
  logger.info(
    `  ${chalk.cyan(String(needsReviewUnassigned.length))} needs review (unassigned), ` +
      `${chalk.dim(String(needsReviewAssigned.length))} needs review (assigned), ` +
      `${chalk.yellow(String(acceptedUnassigned.length))} accepted (unassigned), ` +
      `${chalk.yellow(String(unresponded.length))} unresponded, ` +
      `${chalk.red(String(stale.length))} stale, ` +
      `${chalk.magenta(String(externalPRs.length))} external PRs`
  );

  // Suggestions
  showSuggestions({
    needsReviewUnassigned,
    needsReviewAssigned,
    acceptedUnassigned,
    unresponded,
    stale,
    externalPRs,
    staleDays,
  });
}

// --- Inspect mode ---

function formatLabels(item: { labels: IssueItem['labels'] }): string {
  return (
    getLabels(item)
      .map((l) => l.name)
      .join(', ') || '-'
  );
}

async function displayComments(issueNumber: number, commentCount: number): Promise<void> {
  logger.info(chalk.bold('--- Comments ---'));
  if (commentCount === 0) {
    logger.info(chalk.gray('  No comments.'));
    return;
  }
  const comments = await listAllCommentsAsync(issueNumber);
  for (const comment of comments) {
    const badge = isTeamResponse(comment) ? chalk.green('[TEAM]') : chalk.gray('[EXT]');
    const date = new Date(comment.created_at).toISOString().slice(0, 10);
    logger.info(`  ${badge} ${chalk.dim(comment.user?.login ?? '-')} (${date})`);
    logger.info(`    ${truncate(comment.body ?? '', 300)}`);
    logger.info('');
  }
}

async function inspectIssue(issue: Awaited<ReturnType<typeof getIssueAsync>>) {
  logger.info(chalk.bold('=== Issue #' + issue.number + ' ==='));
  logger.info(`URL:     ${chalk.blue(issue.html_url)}`);
  logger.info(`Title:   ${issue.title}`);
  logger.info(`State:   ${issue.state}`);
  logger.info(`Author:  ${issue.user?.login ?? '-'}`);
  logger.info(`Labels:  ${formatLabels(issue)}`);
  logger.info(`Created: ${issue.created_at}`);
  logger.info(`Updated: ${issue.updated_at}`);
  logger.info('');

  // Body
  logger.info(chalk.bold('--- Body ---'));
  if (issue.body) {
    logger.info(truncate(issue.body, 500));
  } else {
    logger.info(chalk.gray('(no body)'));
  }
  logger.info('');

  // Reproduction URL detection
  if (issue.body) {
    const repoUrls = issue.body.match(/https?:\/\/(snack\.expo\.dev|github\.com)\/[^\s)]+/g);
    if (repoUrls && repoUrls.length > 0) {
      logger.info(chalk.bold('--- Reproduction Links ---'));
      for (const url of repoUrls) {
        logger.info(`  ${chalk.blue(url)}`);
      }
      logger.info('');
    }
  }

  await displayComments(issue.number, issue.comments);

  // Linked PRs — scan body for #NNNN references
  if (issue.body) {
    const refs = [...new Set(issue.body.match(/#(\d{4,6})/g) ?? [])];
    if (refs.length > 0) {
      logger.info(chalk.bold('--- Referenced Issues/PRs ---'));
      for (const ref of refs) {
        logger.info(`  ${ref}`);
      }
      logger.info('');
    }
  }

  // If closed, try to find closer PR
  if (issue.state === 'closed') {
    try {
      const closerUrl = await getIssueCloserPrUrlAsync(issue.number);
      if (closerUrl) {
        logger.info(chalk.bold('--- Closed By ---'));
        logger.info(`  ${chalk.blue(closerUrl)}`);
        logger.info('');
      }
    } catch {
      // ignore
    }
  }
}

async function inspectPR(issue: Awaited<ReturnType<typeof getIssueAsync>>) {
  const pr = await getPullRequestAsync(issue.number);

  logger.info(chalk.bold('=== PR #' + pr.number + ' ==='));
  logger.info(`URL:      ${chalk.blue(pr.html_url)}`);
  logger.info(`Title:    ${pr.title}`);
  logger.info(`State:    ${pr.state}`);
  logger.info(`Author:   ${pr.user?.login ?? '-'}`);
  logger.info(`Labels:   ${formatLabels(pr)}`);
  logger.info(`Branch:   ${pr.base.ref} ← ${pr.head.ref}`);
  logger.info(`Created:  ${pr.created_at}`);
  logger.info(`Updated:  ${pr.updated_at}`);
  logger.info(`Mergeable: ${pr.mergeable ?? 'unknown'}`);
  logger.info('');

  // Diff stats
  logger.info(chalk.bold('--- Diff Stats ---'));
  logger.info(
    `  ${chalk.green(`+${pr.additions}`)} ${chalk.red(`-${pr.deletions}`)} in ${pr.changed_files} files`
  );
  logger.info('');

  // Body
  logger.info(chalk.bold('--- Body ---'));
  if (pr.body) {
    logger.info(truncate(pr.body, 500));
  } else {
    logger.info(chalk.gray('(no body)'));
  }
  logger.info('');

  // Reviews
  logger.info(chalk.bold('--- Reviews ---'));
  try {
    const reviews = await listPullRequestReviewsAsync(pr.number);
    if (reviews.length === 0) {
      logger.info(chalk.gray('  No reviews.'));
    } else {
      for (const review of reviews) {
        const stateColor =
          review.state === 'APPROVED'
            ? chalk.green
            : review.state === 'CHANGES_REQUESTED'
              ? chalk.red
              : chalk.gray;
        const date = review.submitted_at
          ? new Date(review.submitted_at).toISOString().slice(0, 10)
          : '-';
        logger.info(
          `  ${chalk.dim(review.user?.login ?? '-')} — ${stateColor(review.state ?? '-')} (${date})`
        );
      }
    }
  } catch {
    logger.info(chalk.gray('  Could not fetch reviews.'));
  }
  logger.info('');

  await displayComments(issue.number, issue.comments);
}

async function inspectItem(number: number) {
  const issue = await getIssueAsync(number);
  if ('pull_request' in issue && issue.pull_request) {
    await inspectPR(issue);
  } else {
    await inspectIssue(issue);
  }
}

// --- Entry point ---

async function action(options: ActionOptions) {
  // Auth check
  try {
    await getAuthenticatedUserAsync();
  } catch {
    logger.error('GitHub authentication failed. Set the GITHUB_TOKEN environment variable. Create a token at: https://github.com/settings/tokens/new?description=expotools-github&scopes=public_repo');
    process.exit(1);
  }

  if (options.inspect) {
    const number = parseInt(options.inspect, 10);
    if (isNaN(number)) {
      logger.error(`Invalid issue/PR number: ${options.inspect}`);
      process.exit(1);
    }
    await inspectItem(number);
  } else {
    await showDashboard(options);
  }
}

export default (program: Command) => {
  program
    .command('github-inspect')
    .alias('gi', 'ghi')
    .description(
      'Actionable GitHub dashboard for SDK support on-call. ' +
        'Shows issues needing review, unresponded issues, stale issues, and external PRs. ' +
        'Use --inspect to deep-dive into a specific issue or PR.'
    )
    .option(
      '-w, --week <week>',
      'ISO week number (1-53), or "last"/"prev" for previous week. Defaults to current week.'
    )
    .option('-i, --inspect <number>', 'Deep-dive into a specific issue or PR by number.')
    .option('-l, --label <label>', 'Filter by GitHub label.')
    .option('-s, --stale-days <days>', 'Custom stale threshold in days (default: 14).')
    .asyncAction(action);
};
