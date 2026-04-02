#!/usr/bin/env bun
// No API calls — pure local computation on triage JSON output.

import { readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { homedir } from "os";

// --- Types ---

interface Config {
  output_dir: string;
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
  scores: { composite: number };
  tier: 1 | 2 | 3;
  flags: string[];
  is_new: boolean;
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

interface PrioritizedPR {
  number: number;
  url: string;
  title: string;
  author: string;
  tier: number;
  is_new: boolean;
  is_reviewed: boolean;
  composite_score: number;
  additions: number;
  deletions: number;
  changed_files: number;
  quick_win_score: number;
  impact_score: number;
  quick_win_details: {
    diff_size: string;
    file_scope: string;
    change_type: string;
  };
  impact_details: {
    linked_issues: LinkedIssueEngagement[];
    pr_thumbs_up: number;
    pr_comments: number;
  };
}

// --- Quick Win Scoring ---

function computeQuickWinScore(pr: TriagedPR): {
  score: number;
  details: PrioritizedPR["quick_win_details"];
} {
  let score = 0;
  const totalLines = pr.additions + pr.deletions;

  // Diff size
  let diff_size: string;
  if (totalLines <= 20) {
    score += 40;
    diff_size = "tiny";
  } else if (totalLines <= 50) {
    score += 30;
    diff_size = "small";
  } else if (totalLines <= 100) {
    score += 20;
    diff_size = "medium";
  } else if (totalLines <= 300) {
    score += 5;
    diff_size = "large";
  } else {
    diff_size = "very large";
  }

  // File count
  let file_scope: string;
  if (pr.changed_files <= 2) {
    score += 25;
    file_scope = "minimal";
  } else if (pr.changed_files <= 5) {
    score += 15;
    file_scope = "focused";
  } else if (pr.changed_files <= 10) {
    score += 5;
    file_scope = "moderate";
  } else {
    file_scope = "broad";
  }

  // Change type
  const files = pr.files_changed;
  const isDocsOnly = files.every(
    (f) =>
      f.startsWith("docs/") || f.endsWith(".md") || f.includes("CHANGELOG"),
  );
  const testPatterns = [/__tests__\//, /\.test\./, /\.spec\./];
  const isTestOnly = files.every((f) => testPatterns.some((p) => p.test(f)));
  const nativeExtensions = [
    ".m",
    ".swift",
    ".kt",
    ".java",
    "Podfile",
    "build.gradle",
  ];
  const touchesNative = files.some((f) =>
    nativeExtensions.some((ext) => f.endsWith(ext)),
  );

  let change_type: string;
  if (isDocsOnly) {
    score += 20;
    change_type = "docs-only";
  } else if (isTestOnly) {
    score += 15;
    change_type = "test-only";
  } else if (touchesNative) {
    change_type = "native";
  } else {
    change_type = "code";
  }

  // Single-package scope bonus
  const packages = new Set(
    files.filter((f) => f.startsWith("packages/")).map((f) => f.split("/")[1]),
  );
  if (packages.size === 1) score += 10;

  return { score: Math.min(100, score), details: { diff_size, file_scope, change_type } };
}

// --- Impact Scoring ---

function computeImpactScore(
  linkedIssues: LinkedIssueEngagement[],
  prThumbsUp: number,
  prComments: number,
): number {
  let score = 0;

  // Linked issue engagement (take the best issue if multiple)
  let bestIssueScore = 0;
  for (const issue of linkedIssues) {
    let issueScore = 0;
    if (issue.thumbs_up >= 20) issueScore += 35;
    else if (issue.thumbs_up >= 10) issueScore += 25;
    else if (issue.thumbs_up >= 5) issueScore += 15;
    else if (issue.thumbs_up >= 2) issueScore += 8;

    if (issue.comments >= 20) issueScore += 15;
    else if (issue.comments >= 10) issueScore += 10;
    else if (issue.comments >= 5) issueScore += 5;

    bestIssueScore = Math.max(bestIssueScore, issueScore);
  }
  score += bestIssueScore;

  // PR reactions
  if (prThumbsUp >= 10) score += 20;
  else if (prThumbsUp >= 5) score += 12;
  else if (prThumbsUp >= 2) score += 5;

  // PR comment activity
  if (prComments >= 10) score += 10;
  else if (prComments >= 5) score += 5;

  // Has linked issue at all
  if (linkedIssues.length > 0) score += 10;

  return Math.min(100, score);
}

// --- Config & I/O ---

function loadConfig(): Config {
  const configPath = resolve(__dirname, "config.json");
  return JSON.parse(readFileSync(configPath, "utf-8")) as Config;
}

function resolveOutputDir(outputDir: string): string {
  // Resolve relative paths against the skill directory, not CWD
  return resolve(__dirname, outputDir.replace(/^~/, homedir()));
}

function getTriageFilePath(outDir: string): string {
  return join(outDir, "fetch.json");
}

// --- Output ---

function printResults(
  quickWins: PrioritizedPR[],
  highImpact: PrioritizedPR[],
): void {
  console.log("\n=== Quick Wins (fast to review) ===\n");

  for (const pr of quickWins.slice(0, 25)) {
    const diff = `+${pr.additions}/-${pr.deletions}`;
    const tags = [pr.is_new && "*NEW*", pr.is_reviewed && "*REVIEWED*"].filter(Boolean).join(" ");
    const tagStr = tags ? ` ${tags}` : "";
    console.log(
      `  ${pr.url}` +
        `  T${pr.tier}` +
        `  QW:${String(pr.quick_win_score).padStart(2)}` +
        `  Comp:${String(pr.composite_score).padStart(2)}` +
        `  ${diff.padEnd(12)}` +
        `${String(pr.changed_files).padStart(3)} files` +
        `  ${pr.quick_win_details.change_type}${tagStr}`,
    );
    console.log(`    ${pr.title}`);
  }

  console.log("\n=== High Impact (community demand) ===\n");

  if (highImpact.length === 0) {
    console.log("  No PRs with significant linked-issue engagement found.");
    console.log("\n======================");
    return;
  }


  for (const pr of highImpact.slice(0, 25)) {
    const tags = [pr.is_new && "*NEW*", pr.is_reviewed && "*REVIEWED*"].filter(Boolean).join(" ");
    const tagStr = tags ? ` ${tags}` : "";
    console.log(
      `  ${pr.url}` +
        `  T${pr.tier}` +
        `  Impact:${String(pr.impact_score).padStart(2)}` +
        `  QW:${String(pr.quick_win_score).padStart(2)}` +
        `  Comp:${String(pr.composite_score).padStart(2)}${tagStr}`,
    );
    console.log(`    ${pr.title}`);

    // Show linked issues
    for (const issue of pr.impact_details.linked_issues) {
      console.log(
        `    closes #${issue.number} (${issue.thumbs_up}\ud83d\udc4d ${issue.comments} comments)`,
      );
    }

    // Show PR-level engagement separately if nonzero
    if (pr.impact_details.pr_thumbs_up > 0 || pr.impact_details.pr_comments > 0) {
      console.log(
        `    PR itself: ${pr.impact_details.pr_thumbs_up}\ud83d\udc4d ${pr.impact_details.pr_comments} comments`,
      );
    }
  }

  console.log("\n======================");
}

// --- Main ---

function main(): void {
  const config = loadConfig();
  const outDir = resolveOutputDir(config.output_dir);

  // Read triage data
  const triageFile = getTriageFilePath(outDir);
  console.log(`Reading: ${triageFile}`);
  const triage: TriageOutput = JSON.parse(readFileSync(triageFile, "utf-8"));

  console.log(`Total PRs: ${triage.prs.length} (Tier 1: ${triage.tiers.fast_track}, Tier 2: ${triage.tiers.standard}, Tier 3: ${triage.tiers.deep_scrutiny})`);

  // Quick-win scores
  console.log("Computing quick-win and impact scores...");
  const quickWinMap = new Map(
    triage.prs.map((pr) => [pr.number, computeQuickWinScore(pr)]),
  );

  const prioritized: PrioritizedPR[] = triage.prs.map((pr) => {
    const qw = quickWinMap.get(pr.number)!;
    const linkedIssues = pr.linked_issues ?? [];

    const impact_score = computeImpactScore(
      linkedIssues,
      pr.pr_thumbs_up ?? 0,
      pr.pr_comments ?? 0,
    );

    return {
      number: pr.number,
      url: pr.url,
      title: pr.title,
      author: pr.author,
      tier: pr.tier,
      is_new: pr.is_new ?? false,
      is_reviewed: pr.is_reviewed ?? false,
      composite_score: pr.scores.composite,
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files,
      quick_win_score: qw.score,
      impact_score,
      quick_win_details: qw.details,
      impact_details: {
        linked_issues: linkedIssues,
        pr_thumbs_up: pr.pr_thumbs_up ?? 0,
        pr_comments: pr.pr_comments ?? 0,
      },
    };
  });

  // Sort views
  const byQuickWin = [...prioritized].sort(
    (a, b) =>
      b.quick_win_score - a.quick_win_score ||
      b.composite_score - a.composite_score,
  );
  const byImpact = [...prioritized]
    .filter((p) => p.impact_score > 0)
    .sort(
      (a, b) =>
        b.impact_score - a.impact_score ||
        b.composite_score - a.composite_score,
    );

  // Write JSON output
  const outPath = join(outDir, "prioritize.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        prioritized_at: new Date().toISOString(),
        source_triage: triageFile,
        total_prs: triage.prs.length,
        prs: prioritized,
      },
      null,
      2,
    ),
  );
  console.log(`\nPrioritization written to: ${outPath}`);

  printResults(byQuickWin, byImpact);
}

main();
