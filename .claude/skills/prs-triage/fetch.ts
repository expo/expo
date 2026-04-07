#!/usr/bin/env bun

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { homedir } from 'os';

// --- Scoring constants ---

// Author Trust
const MERGED_PRS_TRUSTED = 3;
const MERGED_PRS_SOME = 1;
const ACCOUNT_AGE_ESTABLISHED_DAYS = 365;
const ACCOUNT_AGE_MODERATE_DAYS = 180;
const FOLLOWERS_HIGH = 50;
const FOLLOWERS_MODERATE = 10;
const FOLLOWERS_SOME = 3;
const PUBLIC_REPOS_HIGH = 20;
const PUBLIC_REPOS_SOME = 5;

// Diff Risk
const SMALL_DIFF_LINES = 100;
const MEDIUM_DIFF_LINES = 500;
const FEW_FILES_CHANGED = 3;
const MODERATE_FILES_CHANGED = 10;

// AI Penalty
const NEW_ACCOUNT_DAYS = 90;
const AI_PHRASE_MIN_DIFF_LINES = 200;
const SPRAY_AND_PRAY_OPEN_PRS = 5;

// Composite weights
const WEIGHT_AUTHOR_TRUST = 0.4;
const WEIGHT_DIFF_RISK = 0.35;
const WEIGHT_SCOPE_SAFETY = 0.25;

// Tiers
const TIER_1_MIN_SCORE = 70;
const TIER_2_MIN_SCORE = 40;

// File classification
const TEST_PATTERNS = [/__tests__\//, /\.test\./, /\.spec\./];

// --- Types ---

interface Config {
  repo: string;
  internal_contributors: string[];
  sensitive_paths: string[];
  output_dir: string;
  max_prs_to_review: number;
}

interface GHPullRequest {
  number: number;
  title: string;
  url: string;
  author: { login: string };
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  body: string;
  assignees: string[];
  requested_reviewers: string[];
}

interface GHUser {
  login: string;
  created_at: string;
  followers: number;
  public_repos: number;
  type: string;
}

interface Scores {
  author_trust: number;
  diff_risk: number;
  scope_safety: number;
  ai_penalty: number;
  composite: number;
}

interface LinkedIssueEngagement {
  number: number;
  thumbs_up: number;
  comments: number;
}

interface TriagedPR {
  number: number;
  url: string;
  title: string;
  author: string;
  created_at: string;
  additions: number;
  deletions: number;
  changed_files: number;
  scores: Scores;
  tier: 1 | 2 | 3;
  flags: string[];
  /** An internal contributor has already submitted a review on GitHub */
  is_reviewed: boolean;
  files_changed: string[];
  pr_thumbs_up: number;
  pr_comments: number;
  linked_issues: LinkedIssueEngagement[];
}

interface TriageOutput {
  repo: string;
  triaged_at: string;
  total_open_prs: number;
  external_prs: number;
  offset: number;
  tiers: { fast_track: number; standard: number; deep_scrutiny: number };
  prs: TriagedPR[];
}

// --- GitHub API ---

const TOKEN = process.env.GITHUB_TOKEN;

async function ghApi<T>(path: string): Promise<T> {
  if (!TOKEN) {
    throw new Error(
      'GITHUB_TOKEN environment variable is required.\nSet it with: export GITHUB_TOKEN=ghp_...'
    );
  }

  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (resp.status === 403) {
    const remaining = resp.headers.get('x-ratelimit-remaining');
    if (remaining === '0') {
      const resetAt = resp.headers.get('x-ratelimit-reset');
      const resetDate = resetAt ? new Date(parseInt(resetAt) * 1000).toISOString() : 'unknown';
      throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate}`);
    }
  }

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`GitHub API ${resp.status}: ${path}\n${body}`);
  }

  return resp.json() as Promise<T>;
}

// Fetch with pagination for PR list
async function fetchAllPRs(
  repo: string,
  limit: number,
  offset: number = 0
): Promise<GHPullRequest[]> {
  const perPage = 100;
  const allPRs: GHPullRequest[] = [];
  // Skip full pages, then discard the remainder from the first fetched page
  let page = Math.floor(offset / perPage) + 1;
  const skipInFirstPage = offset % perPage;
  let isFirstBatch = true;

  while (allPRs.length < limit) {
    const batch = await ghApi<GHPullRequest[]>(
      `/repos/${repo}/pulls?state=open&per_page=${perPage}&page=${page}&sort=created&direction=desc`
    );
    if (batch.length === 0) break;

    // Map the REST API response to our internal shape
    // Note: additions/deletions/changedFiles are NOT available from the list endpoint —
    // they come from the files endpoint later (see fetchPRFiles)
    const mapped = batch.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      author: { login: pr.user?.login ?? 'unknown' },
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      createdAt: pr.created_at,
      body: pr.body ?? '',
      assignees: (pr.assignees ?? []).map((a: any) => a.login),
      requested_reviewers: (pr.requested_reviewers ?? []).map((r: any) => r.login),
    }));

    if (isFirstBatch && skipInFirstPage > 0) {
      allPRs.push(...mapped.slice(skipInFirstPage));
      isFirstBatch = false;
    } else {
      allPRs.push(...mapped);
    }
    if (batch.length < perPage) break;
    page++;
  }

  return allPRs.slice(0, limit);
}

interface PRFileInfo {
  filename: string;
  additions: number;
  deletions: number;
}

interface PRFilesResult {
  files: string[];
  additions: number;
  deletions: number;
  changedFiles: number;
}

// Fetch file list for a PR (with pagination for >100 files)
async function fetchPRFiles(repo: string, prNumber: number): Promise<PRFilesResult> {
  const allFiles: PRFileInfo[] = [];
  let page = 1;

  while (true) {
    const batch = await ghApi<PRFileInfo[]>(
      `/repos/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`
    );
    if (batch.length === 0) break;
    allFiles.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return {
    files: allFiles.map((f) => f.filename),
    additions: allFiles.reduce((sum, f) => sum + (f.additions ?? 0), 0),
    deletions: allFiles.reduce((sum, f) => sum + (f.deletions ?? 0), 0),
    changedFiles: allFiles.length,
  };
}

// Fetch user profile
async function fetchUser(login: string): Promise<GHUser> {
  return ghApi<GHUser>(`/users/${login}`);
}

// Search API has a stricter rate limit: 30 requests/minute.
// Serialize search calls with a minimum interval.
let lastSearchCall = 0;
const SEARCH_MIN_INTERVAL_MS = 2100; // ~28 req/min, leaving headroom

async function ghSearchApi<T>(path: string): Promise<T> {
  const now = Date.now();
  const wait = SEARCH_MIN_INTERVAL_MS - (now - lastSearchCall);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastSearchCall = Date.now();
  return ghApi<T>(path);
}

// Fetch merged PR count for user in repo
async function fetchMergedPRCount(repo: string, login: string): Promise<number> {
  const result = await ghSearchApi<{ total_count: number }>(
    `/search/issues?q=author:${login}+repo:${repo}+is:pr+is:merged&per_page=1`
  );
  return result.total_count;
}

// Fetch recent open PRs by user across GitHub (spray-and-pray check)
async function fetchRecentOpenPRs(login: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString().split('T')[0];
  const result = await ghSearchApi<{ total_count: number }>(
    `/search/issues?q=author:${login}+is:pr+is:open+created:>=${sevenDaysAgo}&per_page=1`
  );
  return result.total_count;
}

// --- Batching ---

async function batch<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Promise.all(chunk.map(fn));
    if (i + batchSize < items.length) {
      // Small delay between batches to be nice to the API
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

// --- Author Cache ---
// Caches merged PR count per author to halve the search API calls on repeat runs.
// recentOpenPRs is NOT cached — spray-and-pray detection must be fresh.
// TTL: 24 hours.

interface AuthorCacheEntry {
  mergedPRs: number;
  recentOpenPRs: number;
  recentOpenPRsCachedAt: number; // separate TTL — shorter than mergedPRs
  user: GHUser;
  cachedAt: number; // epoch ms
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (mergedPRs, user profile)
const RECENT_OPEN_PRS_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (recentOpenPRs — shorter for freshness)
// Caches GitHub Search API results per author (merged PR count for Author Trust scoring,
// recent open PRs for spray-and-pray detection). Avoids the 30 req/min search rate limit
// on repeat runs. Safe to delete — rebuilds on next run.
const authorCachePath = resolve(__dirname, '.author-cache.json');

function loadAuthorCache(): Map<string, AuthorCacheEntry> {
  try {
    if (!existsSync(authorCachePath)) return new Map();
    const raw = JSON.parse(readFileSync(authorCachePath, 'utf-8'));
    const now = Date.now();
    const entries = new Map<string, AuthorCacheEntry>();
    for (const [key, entry] of Object.entries(raw)) {
      const e = entry as AuthorCacheEntry;
      if (now - e.cachedAt < CACHE_TTL_MS) {
        entries.set(key, e);
      }
    }
    return entries;
  } catch {
    return new Map();
  }
}

function saveAuthorCache(cache: Map<string, AuthorCacheEntry>): void {
  writeFileSync(authorCachePath, JSON.stringify(Object.fromEntries(cache), null, 2));
}

// --- Scoring ---

function scoreAuthorTrust(user: GHUser, mergedPRs: number): number {
  let score = 0;

  // Prior merged PRs in repo
  if (mergedPRs >= MERGED_PRS_TRUSTED) score += 40;
  else if (mergedPRs >= MERGED_PRS_SOME) score += 25;

  // Account age
  const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / 86400000;
  if (accountAgeDays > ACCOUNT_AGE_ESTABLISHED_DAYS) score += 20;
  else if (accountAgeDays > ACCOUNT_AGE_MODERATE_DAYS) score += 10;

  // Followers
  if (user.followers > FOLLOWERS_HIGH) score += 15;
  else if (user.followers > FOLLOWERS_MODERATE) score += 10;
  else if (user.followers > FOLLOWERS_SOME) score += 5;

  // Public repos
  if (user.public_repos > PUBLIC_REPOS_HIGH) score += 10;
  else if (user.public_repos > PUBLIC_REPOS_SOME) score += 5;

  // Organization account (not individual users with a company field — that's too noisy)
  if (user.type === "Organization") score += 15;

  return Math.min(score, 100);
}

function scoreDiffRisk(
  pr: GHPullRequest,
  files: string[],
  hasLinkedIssue: boolean,
): number {
  let score = 0;
  const totalLines = pr.additions + pr.deletions;

  // Total changed lines
  if (totalLines < SMALL_DIFF_LINES) score += 40;
  else if (totalLines < MEDIUM_DIFF_LINES) score += 20;

  // Files changed
  if (pr.changedFiles <= FEW_FILES_CHANGED) score += 20;
  else if (pr.changedFiles <= MODERATE_FILES_CHANGED) score += 10;

  // Net deletions
  if (pr.deletions > pr.additions) score += 10;

  // Linked issue (uses extractLinkedIssues result, passed in from caller)
  if (hasLinkedIssue) score += 15;

  // Includes tests
  const testPatterns = TEST_PATTERNS;
  const hasTests = files.some((f) => testPatterns.some((p) => p.test(f)));
  const hasCode = files.some((f) => !testPatterns.some((p) => p.test(f)) && !f.endsWith('.md'));
  if (hasTests && hasCode) score += 15;

  return Math.min(score, 100);
}

// Precompile glob-like sensitive path patterns into regexes.
// Escapes regex special chars, then converts `*` to `[^/]+`.
function compileSensitivePaths(patterns: string[]): RegExp[] {
  return patterns.map((sp) => {
    // Escape everything except `*`, then convert `*` to a path-segment wildcard
    const escaped = sp
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex specials
      .replace(/\*/g, '[^/]+'); // convert globs
    return new RegExp('^' + escaped);
  });
}

function scoreScopeSafety(files: string[], sensitiveRegexes: RegExp[]): number {
  // If file list is empty (e.g. fetch failed), return a neutral score — don't reward unknowns
  if (files.length === 0) return 30;

  let score = 0;

  // Docs/changelog only
  const isDocsOnly = files.every(
    (f) => f.startsWith('docs/') || f.endsWith('.md') || f.includes('CHANGELOG')
  );
  if (isDocsOnly) score += 50;

  // Test-only changes
  const testPatterns = TEST_PATTERNS;
  const isTestOnly = files.every((f) => testPatterns.some((p) => p.test(f)));
  if (isTestOnly) score += 40;

  // Sensitive paths (precompiled regexes)
  const touchesSensitive = files.some((f) => sensitiveRegexes.some((re) => re.test(f)));
  if (!touchesSensitive) score += 30;

  // New dependencies
  const touchesPackageJson = files.some(
    (f) => f.endsWith('package.json') && !f.includes('__tests__')
  );
  if (!touchesPackageJson) score += 20;
  else score -= 20;

  return Math.max(0, Math.min(score, 100));
}

function computeAIPenalty(
  pr: GHPullRequest,
  user: GHUser,
  mergedPRs: number,
  recentOpenPRs: number
): { penalty: number; flags: string[] } {
  let penalty = 0;
  const flags: string[] = [];

  // New account + first PR
  const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / 86400000;
  if (accountAgeDays < NEW_ACCOUNT_DAYS && mergedPRs === 0) {
    penalty -= 15;
    flags.push('new_account_first_pr');
  }

  // Generic AI phrases in large PRs
  const aiPhrases = [
    "I've improved",
    'I noticed that',
    'This PR enhances',
    "I've refactored",
    'This improvement',
  ];
  const totalLines = pr.additions + pr.deletions;
  if (
    totalLines > AI_PHRASE_MIN_DIFF_LINES &&
    pr.body &&
    aiPhrases.some((phrase) => pr.body.toLowerCase().includes(phrase.toLowerCase()))
  ) {
    penalty -= 10;
    flags.push('ai_phrases_large_diff');
  }

  // Spray-and-pray pattern
  if (recentOpenPRs > SPRAY_AND_PRAY_OPEN_PRS) {
    penalty -= 10;
    flags.push(`spray_and_pray_${recentOpenPRs}_open_prs`);
  }

  return { penalty, flags };
}

function computeComposite(scores: Omit<Scores, 'composite'>): number {
  const raw =
    scores.author_trust * WEIGHT_AUTHOR_TRUST +
    scores.diff_risk * WEIGHT_DIFF_RISK +
    scores.scope_safety * WEIGHT_SCOPE_SAFETY +
    scores.ai_penalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function assignTier(composite: number): 1 | 2 | 3 {
  if (composite >= TIER_1_MIN_SCORE) return 1;
  if (composite >= TIER_2_MIN_SCORE) return 2;
  return 3;
}

// --- Linked Issue Extraction ---

function extractLinkedIssues(body: string, repo: string): number[] {
  const issues: number[] = [];

  // #123 with closing keyword
  const hashPattern = /(?:fixes|closes|resolves|fix|close|resolve)\s+#(\d+)/gi;
  let match;
  while ((match = hashPattern.exec(body)) !== null) {
    issues.push(parseInt(match[1], 10));
  }

  // Full URL with closing keyword (same repo only)
  const escaped = repo.replace('/', '\\/');
  const urlPattern = new RegExp(
    `(?:fixes|closes|resolves|fix|close|resolve)\\s+https://github\\.com/${escaped}/issues/(\\d+)`,
    'gi'
  );
  while ((match = urlPattern.exec(body)) !== null) {
    issues.push(parseInt(match[1], 10));
  }

  return [...new Set(issues)];
}

// --- Codemention filtering ---

async function getAuthenticatedUser(): Promise<string> {
  const envUser = process.env.GITHUB_USER;
  if (envUser) return envUser;
  const user = await ghApi<{ login: string }>('/user');
  if (!user.login) {
    throw new Error('Could not determine GitHub username from token. Set GITHUB_USER env var.');
  }
  return user.login;
}

function parseCodementionPatterns(username: string): string[] {
  const ymlPath = resolve(__dirname, '../../../.github/codemention.yml');
  if (!existsSync(ymlPath)) return [];

  const content = readFileSync(ymlPath, 'utf-8');
  const patterns: string[] = [];

  // Split into rule blocks (each starts with "  - patterns:")
  const ruleBlocks = content.split(/(?=\s+-\s+patterns:)/);

  for (const block of ruleBlocks) {
    // Flatten multiline arrays by collapsing whitespace
    const flat = block.replace(/\n\s*/g, ' ');

    const mentionsMatch = flat.match(/mentions:\s*\[([^\]]+)\]/);
    if (!mentionsMatch) continue;

    const mentions = mentionsMatch[1].split(',').map((s) =>
      s
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .toLowerCase()
    );

    if (!mentions.includes(username.toLowerCase())) continue;

    const patternsMatch = flat.match(/patterns:\s*\[([^\]]+)\]/);
    if (!patternsMatch) continue;

    const blockPatterns = patternsMatch[1]
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);

    patterns.push(...blockPatterns);
  }

  return patterns;
}

// --- Config ---

function loadConfig(): Config {
  const configPath = resolve(__dirname, 'config.json');
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as Config;
}

function resolveOutputDir(outputDir: string): string {
  const resolved = outputDir.replace(/^~/, homedir());
  // Resolve relative paths against the skill directory, not CWD
  return resolve(__dirname, resolved);
}

// --- Output ---

function printDryRun(allPRs: GHPullRequest[], externalPRs: GHPullRequest[]): void {
  console.log('\n=== Dry Run ===\n');
  console.log(`Total open PRs: ${allPRs.length}`);
  console.log(`External PRs:   ${externalPRs.length}`);

  if (externalPRs.length > 0) {
    console.log('\n--- External PRs ---\n');
    for (const pr of externalPRs) {
      console.log(`  ${pr.url} by @${pr.author.login} — ${pr.title}`);
    }
  }

  console.log('\nRun without --dry-run to compute scores and generate triage JSON.');
}

// --- Main ---

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const unfiltered = args.includes('--unfiltered');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 200;
  const offsetIdx = args.indexOf('--offset');
  const offset = offsetIdx >= 0 ? parseInt(args[offsetIdx + 1], 10) : 0;

  const config = loadConfig();

  const username = await getAuthenticatedUser();
  let codementionPatterns: string[] = [];
  if (!unfiltered) {
    codementionPatterns = parseCodementionPatterns(username);
    console.log(
      `Filtering for @${username} — ${codementionPatterns.length} codemention pattern(s). Use --unfiltered to see all external PRs.`
    );
  }
  const internalSet = new Set(config.internal_contributors.map((c) => c.toLowerCase()));

  console.log('Fetching and scoring external PRs — this may take a few minutes...\n');

  // Phase 1: Fetch PRs
  console.log(
    `Fetching open PRs from ${config.repo}${offset > 0 ? ` (offset: ${offset})` : ''}...`
  );
  const allPRs = await fetchAllPRs(config.repo, limit, offset);
  console.log(`Fetched ${allPRs.length} open PRs.`);

  // Fetch PRs assigned to the current user — these may be outside the pagination window.
  // The Pulls endpoint doesn't support assignee filtering, so use the Issues endpoint instead.
  {
    const assignedIssues = await ghApi<any[]>(
      `/repos/${config.repo}/issues?assignee=${username}&state=open&per_page=100`,
    );
    const assignedPRs = assignedIssues.filter((i: any) => i.pull_request);
    const existingNumbers = new Set(allPRs.map((p) => p.number));
    let injected = 0;
    for (const pr of assignedPRs) {
      if (!existingNumbers.has(pr.number)) {
        allPRs.push({
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          author: { login: pr.user?.login ?? 'unknown' },
          additions: 0,
          deletions: 0,
          changedFiles: 0,
          createdAt: pr.created_at,
          body: pr.body ?? '',
          assignees: (pr.assignees ?? []).map((a: any) => a.login),
          requested_reviewers: [],
        });
        injected++;
      }
    }
    if (injected > 0) {
      console.log(`Injected ${injected} assigned PR(s) outside pagination window.`);
    }
  }

  const externalPRs = allPRs.filter((pr) => !internalSet.has(pr.author.login.toLowerCase()));

  console.log(
    `External PRs: ${externalPRs.length} (filtered ${allPRs.length - externalPRs.length} internal)`
  );

  if (isDryRun) {
    printDryRun(allPRs, externalPRs);
    return;
  }

  if (externalPRs.length === 0) {
    console.log('No external PRs to triage.');
    return;
  }

  // Phase 2: Score each PR

  // 2a. Fetch file lists (needed for codemention filtering + accurate diff stats)
  console.log(`Fetching file lists for ${externalPRs.length} PRs...`);
  const prFilesData = new Map<number, PRFilesResult>();

  await batch(externalPRs, 10, async (pr) => {
    try {
      const result = await fetchPRFiles(config.repo, pr.number);
      prFilesData.set(pr.number, result);
    } catch {
      prFilesData.set(pr.number, {
        files: [],
        additions: 0,
        deletions: 0,
        changedFiles: 0,
      });
    }
    process.stdout.write('.');
  });
  console.log(' done.');

  // Filter to PRs relevant to the current user (codemention patterns + assigned/review-requested)
  let relevantPRs = externalPRs;
  if (!unfiltered) {
    const lowerUser = username.toLowerCase();
    const prefixes = codementionPatterns.map((p) => p.replace(/\/?\*\*$/, '/'));
    relevantPRs = externalPRs.filter((pr) => {
      if (pr.assignees.some((a) => a.toLowerCase() === lowerUser)) return true;
      if (pr.requested_reviewers.some((r) => r.toLowerCase() === lowerUser)) return true;
      const files = prFilesData.get(pr.number)?.files ?? [];
      return files.some((file) => prefixes.some((prefix) => file.startsWith(prefix)));
    });
    console.log(
      `Relevant to @${username}: ${relevantPRs.length} PRs (from ${externalPRs.length} external)`,
    );
  }

  // 2b. Deduplicate authors and fetch profiles + merged counts
  const uniqueAuthors = [...new Set(relevantPRs.map((pr) => pr.author.login))];
  console.log(`\nFetching profiles for ${uniqueAuthors.length} unique authors...`);

  const authorProfiles = new Map<
    string,
    { user: GHUser; mergedPRs: number; recentOpenPRs: number }
  >();

  // User profile calls use the regular API (5000 req/hr) — batch those.
  // Search calls (merged PRs, recent open PRs) are rate-limited to 30/min — serialized via ghSearchApi.
  // Strategy: batch-fetch all user profiles first, then run search calls sequentially.

  // Step 1: Fetch user profiles (use cache for known authors, fetch new ones)
  const authorCache = loadAuthorCache();
  const userProfiles = new Map<string, GHUser>();
  const uncachedProfileAuthors = uniqueAuthors.filter((login) => {
    const cached = authorCache.get(login);
    if (cached?.user) {
      userProfiles.set(login, cached.user);
      return false;
    }
    return true;
  });

  if (uncachedProfileAuthors.length > 0) {
    console.log(
      `Fetching profiles for ${uncachedProfileAuthors.length} new authors (${uniqueAuthors.length - uncachedProfileAuthors.length} cached)...`
    );
    await batch(uncachedProfileAuthors, 10, async (login) => {
      try {
        const user = await fetchUser(login);
        userProfiles.set(login, user);
      } catch (err) {
        console.warn(
          `\n  Warning: failed to fetch profile for @${login}: ${(err as Error).message}`
        );
        userProfiles.set(login, {
          login,
          created_at: new Date().toISOString(),
          followers: 0,
          public_repos: 0,
          type: 'User',
        });
      }
      process.stdout.write('.');
    });
    console.log(' done.');
  } else {
    console.log(`All ${uniqueAuthors.length} author profiles found in cache.`);
  }

  // Step 2: Search calls (serialized due to 30 req/min search rate limit)
  // Cache saves mergedPRs + user profile (stable). recentOpenPRs is always
  // fetched live since spray-and-pray detection is time-sensitive.
  const uncachedAuthors = uniqueAuthors.filter((login) => !authorCache.has(login));
  const cachedCount = uniqueAuthors.length - uncachedAuthors.length;

  // Count how many search calls we actually need
  const now = Date.now();
  const recentOpenPRsCacheHits = uniqueAuthors.filter((login) => {
    const c = authorCache.get(login);
    return c?.recentOpenPRsCachedAt && now - c.recentOpenPRsCachedAt < RECENT_OPEN_PRS_TTL_MS;
  }).length;
  const totalSearchCalls = cachedCount - recentOpenPRsCacheHits + uncachedAuthors.length * 2;
  const estimatedSeconds = Math.ceil((totalSearchCalls * SEARCH_MIN_INTERVAL_MS) / 1000);
  console.log(
    `Fetching contribution history (${cachedCount} cached, ${uncachedAuthors.length} new, ${totalSearchCalls} search calls, ~${estimatedSeconds}s)...`
  );
  const searchStart = Date.now();
  for (let i = 0; i < uniqueAuthors.length; i++) {
    const login = uniqueAuthors[i];
    const cached = authorCache.get(login);
    try {
      const mergedPRs = cached ? cached.mergedPRs : await fetchMergedPRCount(config.repo, login);
      const recentOpenPRsCached =
        cached?.recentOpenPRsCachedAt &&
        Date.now() - cached.recentOpenPRsCachedAt < RECENT_OPEN_PRS_TTL_MS;
      const recentOpenPRs = recentOpenPRsCached
        ? cached!.recentOpenPRs
        : await fetchRecentOpenPRs(login);
      authorProfiles.set(login, {
        user: userProfiles.get(login)!,
        mergedPRs,
        recentOpenPRs,
      });
      const now = Date.now();
      authorCache.set(login, {
        mergedPRs,
        recentOpenPRs,
        recentOpenPRsCachedAt: recentOpenPRsCached ? cached!.recentOpenPRsCachedAt : now,
        user: userProfiles.get(login)!,
        cachedAt: cached?.cachedAt ?? now,
      });
    } catch (err) {
      console.warn(`\n  Warning: search failed for @${login}: ${(err as Error).message}`);
      authorProfiles.set(login, {
        user: userProfiles.get(login)!,
        mergedPRs: cached?.mergedPRs ?? 0,
        recentOpenPRs: 0,
      });
    }
    const elapsed = Math.round((Date.now() - searchStart) / 1000);
    const remaining = Math.round((elapsed / (i + 1)) * (uniqueAuthors.length - i - 1));
    process.stdout.write(
      `\r  [${i + 1}/${uniqueAuthors.length}] ${elapsed}s elapsed, ~${remaining}s remaining`
    );
  }
  saveAuthorCache(authorCache);
  console.log('\n  Search done.');

  // 2c. Fetch engagement data (PR reactions/comments) and review status
  console.log(`Fetching engagement data and reviews for ${relevantPRs.length} PRs...`);
  const prEngagement = new Map<number, { comments: number; thumbs_up: number }>();
  const prReviewedByInternal = new Set<number>();

  await batch(relevantPRs, 10, async (pr) => {
    try {
      // Fetch engagement + reviews in parallel for each PR
      const [detail, reviews] = await Promise.all([
        ghApi<any>(`/repos/${config.repo}/issues/${pr.number}`),
        ghApi<any[]>(`/repos/${config.repo}/pulls/${pr.number}/reviews`),
      ]);
      prEngagement.set(pr.number, {
        comments: detail.comments ?? 0,
        thumbs_up: detail.reactions?.['+1'] ?? 0,
      });
      // Check if any internal contributor has reviewed
      if (reviews?.some((r: any) => internalSet.has(r.user?.login?.toLowerCase()))) {
        prReviewedByInternal.add(pr.number);
      }
    } catch {
      prEngagement.set(pr.number, { comments: 0, thumbs_up: 0 });
    }
    process.stdout.write('.');
  });
  console.log(' done.');

  // Extract linked issues from PR bodies and fetch their details
  const prLinkedIssues = new Map<number, number[]>();
  const allLinkedIssueNums = new Set<number>();
  for (const pr of relevantPRs) {
    const issues = extractLinkedIssues(pr.body, config.repo);
    prLinkedIssues.set(pr.number, issues);
    issues.forEach((n) => allLinkedIssueNums.add(n));
  }

  const issueEngagement = new Map<number, LinkedIssueEngagement>();
  const uniqueIssues = [...allLinkedIssueNums];
  if (uniqueIssues.length > 0) {
    console.log(`Fetching ${uniqueIssues.length} linked issues...`);
    await batch(uniqueIssues, 10, async (issueNum) => {
      try {
        const detail = await ghApi<any>(`/repos/${config.repo}/issues/${issueNum}`);
        issueEngagement.set(issueNum, {
          number: issueNum,
          thumbs_up: detail.reactions?.['+1'] ?? 0,
          comments: detail.comments ?? 0,
        });
      } catch {
        // Issue might not exist or be in another repo — skip
      }
      process.stdout.write('.');
    });
    console.log(' done.');
  }

  // 2d. Compute scores
  console.log('Computing scores...');
  const sensitiveRegexes = compileSensitivePaths(config.sensitive_paths);
  const triagedPRs: TriagedPR[] = [];

  for (const pr of relevantPRs) {
    const profile = authorProfiles.get(pr.author.login)!;
    const filesData = prFilesData.get(pr.number) ?? {
      files: [],
      additions: 0,
      deletions: 0,
      changedFiles: 0,
    };

    // Use accurate additions/deletions/changedFiles from the files endpoint
    // (the PR list endpoint doesn't include these fields)
    const prWithFileStats = {
      ...pr,
      additions: filesData.additions,
      deletions: filesData.deletions,
      changedFiles: filesData.changedFiles,
    };

    const authorTrust = scoreAuthorTrust(profile.user, profile.mergedPRs);
    const hasLinkedIssue = (prLinkedIssues.get(pr.number)?.length ?? 0) > 0;
    const diffRisk = scoreDiffRisk(prWithFileStats, filesData.files, hasLinkedIssue);
    const scopeSafety = scoreScopeSafety(filesData.files, sensitiveRegexes);
    const { penalty, flags } = computeAIPenalty(
      prWithFileStats,
      profile.user,
      profile.mergedPRs,
      profile.recentOpenPRs
    );

    const scores: Scores = {
      author_trust: authorTrust,
      diff_risk: diffRisk,
      scope_safety: scopeSafety,
      ai_penalty: penalty,
      composite: computeComposite({
        author_trust: authorTrust,
        diff_risk: diffRisk,
        scope_safety: scopeSafety,
        ai_penalty: penalty,
      }),
    };

    const engagement = prEngagement.get(pr.number);
    const linkedNums = prLinkedIssues.get(pr.number) ?? [];

    triagedPRs.push({
      number: pr.number,
      url: pr.url,
      title: pr.title,
      author: pr.author.login,
      created_at: pr.createdAt,
      additions: filesData.additions,
      deletions: filesData.deletions,
      changed_files: filesData.changedFiles,
      scores,
      tier: assignTier(scores.composite),
      flags,
      is_reviewed: prReviewedByInternal.has(pr.number),
      files_changed: filesData.files,
      pr_thumbs_up: engagement?.thumbs_up ?? 0,
      pr_comments: engagement?.comments ?? 0,
      linked_issues: linkedNums
        .map((n) => issueEngagement.get(n))
        .filter((d): d is LinkedIssueEngagement => d !== undefined),
    });
  }

  // Sort by composite score descending
  triagedPRs.sort((a, b) => b.scores.composite - a.scores.composite);

  // Phase 3: Output
  const output: TriageOutput = {
    repo: config.repo,
    triaged_at: new Date().toISOString(),
    total_open_prs: allPRs.length,
    external_prs: externalPRs.length,
    offset,
    tiers: {
      fast_track: triagedPRs.filter((p) => p.tier === 1).length,
      standard: triagedPRs.filter((p) => p.tier === 2).length,
      deep_scrutiny: triagedPRs.filter((p) => p.tier === 3).length,
    },
    prs: triagedPRs,
  };

  const outDir = resolveOutputDir(config.output_dir);
  mkdirSync(outDir, { recursive: true });

  const reviewedCount = triagedPRs.filter((p) => p.is_reviewed).length;
  if (reviewedCount > 0) {
    console.log(`${reviewedCount} PRs already reviewed by team.`);
  }

  const outPath = join(outDir, 'fetch.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Triage written to: ${outPath}`);

}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
