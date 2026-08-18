#!/usr/bin/env bun

import { readFileSync, unlinkSync } from 'fs';

// --- Types ---

interface ReviewComment {
  path: string;
  line: number;
  side: 'LEFT' | 'RIGHT';
  body: string;
  severity: 'critical' | 'design' | 'suggestion' | 'nit';
  /** Substring of the target line's content. Used to verify/resolve the correct line in the diff. */
  line_content?: string;
}

interface ReviewPayload {
  pr_url: string;
  pull_number: number;
  summary: string;
  verdict: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' | 'REJECT';
  /** SHA of the commit this review targets. Pins comments to a specific commit so they don't drift if the PR is updated. */
  commit_id?: string;
  comments: ReviewComment[];
}

// --- Diff parsing ---

interface DiffLine {
  side: 'LEFT' | 'RIGHT' | 'BOTH';
  leftLine: number;
  rightLine: number;
  content: string;
}

interface FileDiff {
  path: string;
  lines: DiffLine[];
}

function parseDiff(diffText: string): FileDiff[] {
  const files: FileDiff[] = [];
  const diffLines = diffText.split('\n');

  let currentFile: FileDiff | null = null;
  let leftLine = 0;
  let rightLine = 0;

  for (const line of diffLines) {
    // New file
    if (line.startsWith('diff --git')) {
      if (currentFile) files.push(currentFile);
      currentFile = null;
      continue;
    }

    // File path from +++ line
    if (line.startsWith('+++ b/')) {
      currentFile = { path: line.slice(6), lines: [] };
      continue;
    }

    // Hunk header
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch && currentFile) {
      leftLine = parseInt(hunkMatch[1], 10);
      rightLine = parseInt(hunkMatch[2], 10);
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith('-')) {
      currentFile.lines.push({
        side: 'LEFT',
        leftLine,
        rightLine: -1,
        content: line.slice(1),
      });
      leftLine++;
    } else if (line.startsWith('+')) {
      currentFile.lines.push({
        side: 'RIGHT',
        leftLine: -1,
        rightLine,
        content: line.slice(1),
      });
      rightLine++;
    } else if (line.startsWith(' ')) {
      currentFile.lines.push({
        side: 'BOTH',
        leftLine,
        rightLine,
        content: line.slice(1),
      });
      leftLine++;
      rightLine++;
    }
    // Skip \ No newline at end of file and other non-content lines
  }

  if (currentFile) files.push(currentFile);
  return files;
}

function getLineContent(
  fileDiffs: FileDiff[],
  path: string,
  side: 'LEFT' | 'RIGHT',
  line: number
): string | null {
  const fileDiff = fileDiffs.find((f) => f.path === path);
  if (!fileDiff) return null;

  for (const dl of fileDiff.lines) {
    const lineNum = side === 'LEFT' ? dl.leftLine : dl.rightLine;
    if (lineNum === line && (dl.side === side || dl.side === 'BOTH')) {
      return dl.content;
    }
  }
  return null;
}

function resolveLineFromContent(
  fileDiffs: FileDiff[],
  path: string,
  side: 'LEFT' | 'RIGHT',
  lineContent: string,
  hintLine: number
): { line: number; content: string } | null {
  const fileDiff = fileDiffs.find((f) => f.path === path);
  if (!fileDiff) return null;

  const needle = lineContent.trim();
  if (!needle) return null;
  const candidates: { line: number; content: string }[] = [];

  for (const dl of fileDiff.lines) {
    if (dl.side !== side && dl.side !== 'BOTH') continue;
    const lineNum = side === 'LEFT' ? dl.leftLine : dl.rightLine;
    if (lineNum < 0) continue;

    if (dl.content.trim().includes(needle)) {
      candidates.push({ line: lineNum, content: dl.content });
    }
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Multiple matches — pick the one closest to hintLine
  candidates.sort((a, b) => Math.abs(a.line - hintLine) - Math.abs(b.line - hintLine));
  return candidates[0];
}

async function fetchDiff(pullNumber: number): Promise<FileDiff[]> {
  const diffText = (await githubRequest(`/repos/expo/expo/pulls/${pullNumber}`, {
    accept: 'application/vnd.github.v3.diff',
  })) as string;
  return parseDiff(diffText);
}

// --- Line resolution ---

interface ResolvedComment extends ReviewComment {
  resolvedLine: number;
  targetContent: string | null;
  resolution: 'exact' | 'resolved' | 'unverified';
}

function resolveComments(comments: ReviewComment[], fileDiffs: FileDiff[]): ResolvedComment[] {
  return comments.map((c) => {
    if (!fileDiffs.length) {
      return { ...c, resolvedLine: c.line, targetContent: null, resolution: 'unverified' as const };
    }

    // If line_content is provided, use it to find the correct line
    if (c.line_content) {
      const resolved = resolveLineFromContent(
        fileDiffs,
        c.path,
        c.side || 'RIGHT',
        c.line_content,
        c.line
      );
      if (resolved) {
        return {
          ...c,
          resolvedLine: resolved.line,
          targetContent: resolved.content,
          resolution: resolved.line === c.line ? ('exact' as const) : ('resolved' as const),
        };
      }
    }

    // Fall back to checking specified line
    const content = getLineContent(fileDiffs, c.path, c.side || 'RIGHT', c.line);
    return {
      ...c,
      resolvedLine: c.line,
      targetContent: content,
      resolution: content !== null ? ('exact' as const) : ('unverified' as const),
    };
  });
}

// --- Validation ---

function validate(data: unknown): ReviewPayload {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Review file must contain a JSON object');
  }

  const obj = data as Record<string, unknown>;
  const required = ['pr_url', 'pull_number', 'summary', 'verdict', 'comments'];
  for (const key of required) {
    if (!(key in obj)) {
      throw new Error(`Missing required field: ${key}`);
    }
  }

  const prUrlPattern = /^https:\/\/github\.com\/expo\/expo\/pull\/\d+$/;
  if (typeof obj.pr_url !== 'string' || !prUrlPattern.test(obj.pr_url)) {
    throw new Error(
      `Invalid pr_url: ${obj.pr_url}. Must match https://github.com/expo/expo/pull/<number>`
    );
  }

  if (typeof obj.summary !== 'string' || !obj.summary) {
    throw new Error('summary must be a non-empty string');
  }

  if (
    typeof obj.pull_number !== 'number' ||
    !Number.isInteger(obj.pull_number) ||
    obj.pull_number <= 0
  ) {
    throw new Error('pull_number must be a positive integer');
  }

  if (obj.pr_url !== `https://github.com/expo/expo/pull/${obj.pull_number}`) {
    throw new Error(
      `pr_url doesn't match pull_number. Expected https://github.com/expo/expo/pull/${obj.pull_number}`
    );
  }

  if (!['APPROVE', 'REQUEST_CHANGES', 'COMMENT', 'REJECT'].includes(obj.verdict as string)) {
    throw new Error(
      `Invalid verdict: ${obj.verdict}. Must be APPROVE, REQUEST_CHANGES, COMMENT, or REJECT`
    );
  }

  if (obj.commit_id !== undefined) {
    if (typeof obj.commit_id !== 'string' || !/^[0-9a-f]{7,64}$/i.test(obj.commit_id)) {
      throw new Error(`Invalid commit_id: must be a hex SHA (7–64 chars)`);
    }
  }

  if (!Array.isArray(obj.comments)) {
    throw new Error('comments must be an array');
  }

  for (let i = 0; i < obj.comments.length; i++) {
    const c = obj.comments[i];
    if (!c.path || typeof c.path !== 'string') {
      throw new Error(`comments[${i}].path must be a non-empty string`);
    }
    if (c.path.startsWith('/') || c.path.split('/').includes('..')) {
      throw new Error(
        `comments[${i}].path must be a repo-relative path without '..' segments (got: ${c.path})`
      );
    }
    if (typeof c?.line !== 'number' || !Number.isInteger(c.line) || c.line <= 0) {
      throw new Error(`comments[${i}].line must be a positive integer`);
    }
    if (c.side !== undefined && c.side !== 'LEFT' && c.side !== 'RIGHT') {
      throw new Error(`comments[${i}].side must be 'LEFT' or 'RIGHT' when provided`);
    }
    if (!c.body || typeof c.body !== 'string') {
      throw new Error(`comments[${i}].body must be a non-empty string`);
    }
    if (!['critical', 'design', 'suggestion', 'nit'].includes(c.severity)) {
      throw new Error(`comments[${i}].severity must be critical, design, suggestion, or nit`);
    }
  }

  return data as ReviewPayload;
}

// --- Severity formatting ---

const SEVERITY_LABELS: Record<string, string> = {
  critical: '\u{1F6A8} **critical**',
  design: '\u{1F3D7}\u{FE0F} **design**',
  suggestion: '\u{1F4A1} suggestion',
  nit: '\u{1F427} nit',
};

function formatCommentBody(comment: ReviewComment): string {
  const label = SEVERITY_LABELS[comment.severity] ?? comment.severity;
  return `[${label}] ${comment.body}`;
}

// --- GitHub API ---

async function githubRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accept?: string;
  } = {}
): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN environment variable is required.\n' +
        'Set it with: export GITHUB_TOKEN=$(gh auth token)'
    );
  }

  const accept = options.accept ?? 'application/vnd.github+json';
  const url = `https://api.github.com${path}`;
  const resp = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const responseBody = await resp.text();

  if (!resp.ok) {
    throw new Error(
      `GitHub API error ${resp.status} ${resp.statusText}\n` +
        `${options.method ?? 'GET'} ${url}\n` +
        responseBody
    );
  }

  // Return raw text for non-JSON accept types (e.g. diffs)
  if (accept !== 'application/vnd.github+json') {
    return responseBody;
  }

  return responseBody ? JSON.parse(responseBody) : null;
}

async function postReview(review: ReviewPayload, resolved: ResolvedComment[]): Promise<number> {
  const { pull_number, summary, verdict } = review;

  const apiComments = resolved.map((c) => ({
    path: c.path,
    line: c.resolvedLine,
    side: c.side || 'RIGHT',
    body: formatCommentBody(c),
  }));

  const verdictLabel =
    verdict === 'APPROVE'
      ? '✅ APPROVE'
      : verdict === 'REQUEST_CHANGES'
        ? '🔴 REQUEST_CHANGES'
        : '💬 COMMENT';
  const bodyWithVerdict = `**Suggested verdict: ${verdictLabel}**\n\n${summary}`;

  const body: Record<string, unknown> = {
    body: bodyWithVerdict,
    comments: apiComments,
    ...(review.commit_id ? { commit_id: review.commit_id } : {}),
  };

  const result = (await githubRequest(`/repos/expo/expo/pulls/${pull_number}/reviews`, {
    method: 'POST',
    body,
  })) as { id: number };

  return result.id;
}

// --- Preview ---

function printPreview(review: ReviewPayload, resolved: ResolvedComment[]): void {
  const counts: Record<string, number> = {};
  for (const c of review.comments) {
    counts[c.severity] = (counts[c.severity] ?? 0) + 1;
  }

  console.log('=== Review Preview ===\n');
  console.log(`PR:      ${review.pr_url}`);
  console.log(`Verdict: ${review.verdict}`);
  console.log(
    `Comments: ${review.comments.length} total` +
      (Object.keys(counts).length > 0
        ? ` (${Object.entries(counts)
            .map(([s, n]) => `${n} ${s}`)
            .join(', ')})`
        : '')
  );
  console.log(`\n--- Summary ---\n${review.summary}`);

  if (resolved.length > 0) {
    console.log('\n--- Inline Comments ---');
    for (const c of resolved) {
      const lineInfo =
        c.resolvedLine !== c.line
          ? ` (line ${c.line} -> ${c.resolvedLine} via line_content match)`
          : '';
      console.log(`\n  ${c.path}:${c.resolvedLine} ${c.side} [${c.severity}]${lineInfo}`);

      // Show target code line
      if (c.targetContent !== null) {
        console.log(`  > ${c.targetContent.trimStart()}`);
      } else if (c.resolution === 'unverified') {
        console.log(`  > ⚠️  Line not found in diff — comment may land on wrong position`);
      }

      console.log(`  ${c.body}`);
    }
  }

  console.log('\n======================');
  console.log("Run with 'post-pending' to stage this review on GitHub.");
}

async function submitReview(
  pullNumber: number,
  reviewId: number,
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'
): Promise<void> {
  await githubRequest(`/repos/expo/expo/pulls/${pullNumber}/reviews/${reviewId}/events`, {
    method: 'POST',
    body: { event },
  });
}

// --- Main ---

function loadReview(filePath: string): ReviewPayload {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Cannot read file: ${filePath}\n${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${filePath}`);
  }

  return validate(parsed);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const [command, ...rest] = args;

  if (!command || rest.length < 1) {
    console.log('Usage: post-review.ts <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log(
      '  local-preview  <review-file.json>                              Validate and preview the review locally'
    );
    console.log(
      '  post-pending  <review-file.json>                         Stage the review as PENDING on GitHub'
    );
    console.log(
      '  submit   <review-file.json> <review_id> [APPROVE|REQUEST_CHANGES|COMMENT]  Submit a pending review'
    );
    console.log(
      '  close    <review-file.json>                              Comment and close a REJECT PR'
    );
    process.exit(1);
  }

  const filePath = rest[0];
  const review = loadReview(filePath);

  switch (command) {
    case 'local-preview': {
      console.log('Fetching diff to verify line targets...\n');
      const fileDiffs = await fetchDiff(review.pull_number);
      const resolved = resolveComments(review.comments, fileDiffs);
      printPreview(review, resolved);
      break;
    }

    case 'post-pending': {
      if (review.verdict === 'REJECT') {
        console.error(
          "REJECT verdicts skip review — use 'close' instead to comment and close the PR."
        );
        process.exit(1);
      }
      console.log('Fetching diff to verify line targets...\n');
      const fileDiffs = await fetchDiff(review.pull_number);
      const resolved = resolveComments(review.comments, fileDiffs);
      printPreview(review, resolved);

      // Warn about corrections
      const corrections = resolved.filter((c) => c.resolvedLine !== c.line);
      if (corrections.length > 0) {
        console.log(
          `\n⚠️  ${corrections.length} comment(s) had line numbers corrected via line_content matching.`
        );
      }

      console.log('\nStaging review as PENDING on GitHub...');
      const reviewId = await postReview(review, resolved);
      console.log(`\nReview staged successfully (review ID: ${reviewId}).`);
      console.log(`\nOpen the PR to edit your pending comments:`);
      console.log(`  ${review.pr_url}/files`);
      console.log(`\nWhen ready, submit from GitHub UI or run:`);
      console.log(`  bun run ${process.argv[1]} submit ${filePath} ${reviewId} ${review.verdict}`);
      break;
    }

    case 'submit': {
      const reviewId = parseInt(rest[1], 10);
      if (isNaN(reviewId)) {
        console.error(
          'Usage: submit <review-file.json> <review_id> [APPROVE|REQUEST_CHANGES|COMMENT]'
        );
        process.exit(1);
      }
      type SubmitEvent = 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
      const validEvents: SubmitEvent[] = ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'];
      const event: SubmitEvent | undefined = rest[2]
        ? validEvents.find((e) => e === rest[2])
        : validEvents.find((e) => e === review.verdict);
      if (!event) {
        console.error(
          `Invalid event: ${rest[2] ?? review.verdict}. Must be APPROVE, REQUEST_CHANGES, or COMMENT`
        );
        process.exit(1);
      }
      console.log(`Submitting review ${reviewId} as ${event}...`);
      await submitReview(review.pull_number, reviewId, event);
      console.log('Review submitted successfully.');
      try {
        unlinkSync(filePath);
      } catch {}
      break;
    }

    case 'close': {
      if (review.verdict !== 'REJECT') {
        console.error(`'close' is only for REJECT verdicts (this review is ${review.verdict}).`);
        process.exit(1);
      }
      console.log(`Commenting and closing ${review.pr_url}...\n`);
      console.log(`Comment:\n${review.summary}\n`);
      await githubRequest(`/repos/expo/expo/pulls/${review.pull_number}`, {
        method: 'PATCH',
        body: { state: 'closed' },
      });
      await githubRequest(`/repos/expo/expo/issues/${review.pull_number}/comments`, {
        method: 'POST',
        body: { body: review.summary },
      });
      console.log('PR closed.');
      try {
        unlinkSync(filePath);
      } catch {}
      break;
    }

    default:
      console.error(
        `Unknown command: ${command}. Use 'local-preview', 'post-pending', 'submit', or 'close'.`
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
