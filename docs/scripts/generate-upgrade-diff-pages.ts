import fs from 'node:fs';
import path from 'node:path';

import {
  buildUpgradeHelperAttribution,
  buildUpgradeInstructions,
} from '../ui/components/TemplateBareMinimumDiffViewer/buildUpgradePrompt.ts';

type UpgradeDiffInfo = {
  versions: string[];
  diffs: Record<string, string>;
};

type UpgradePair = { from: string; to: string };

const PAIR_DIR_PATTERN = /^[^/]+-to-[^/]+$/;
const LEGACY_FLAT_PAIR_FILE_PATTERN = /^.+-to-.+\.md$/;

function versionRank(version: string): number {
  return version === 'unversioned' ? Number.POSITIVE_INFINITY : Number(version);
}

function compareVersions(a: string, b: string): number {
  const rankA = versionRank(a);
  const rankB = versionRank(b);
  return rankA === rankB ? 0 : rankA < rankB ? -1 : 1;
}

export function listUpgradePairs(
  diffInfo: UpgradeDiffInfo,
  { includeUnversioned }: { includeUnversioned: boolean }
): UpgradePair[] {
  const pairs: UpgradePair[] = [];

  for (const [diffName, diff] of Object.entries(diffInfo.diffs)) {
    const [from, to] = diffName.split('..');
    if (!from || !to || !diff.trim()) {
      continue;
    }
    if (!includeUnversioned && (from === 'unversioned' || to === 'unversioned')) {
      continue;
    }
    if (compareVersions(from, to) >= 0) {
      continue;
    }
    pairs.push({ from, to });
  }

  return pairs.sort((a, b) => compareVersions(a.from, b.from) || compareVersions(a.to, b.to));
}

export function upgradeDiffPagePath(from: string, to: string): string {
  return `${from}-to-${to}/index.md`;
}

/**
 * Whether an out/-relative markdown path is a generated upgrade pair page.
 * Pair pages have no HTML sibling, so check-markdown-pages skips them.
 */
export function isUpgradePairMarkdownPath(relPath: string): boolean {
  const posixPath = relPath.split(path.sep).join('/');
  const match = posixPath.match(/^bare\/upgrade\/([^/]+)\/index\.md$/);
  return match ? PAIR_DIR_PATTERN.test(match[1]) : false;
}

export function buildUpgradeDiffMarkdown({ from, to, diff }: UpgradePair & { diff: string }) {
  const fence = diff.includes('```') ? '````' : '```';
  const helperUrl = `https://docs.expo.dev/bare/upgrade/?fromSdk=${from}&toSdk=${to}`;

  return [
    '---',
    `title: Upgrade native projects from SDK ${from} to SDK ${to}`,
    `description: Ready-to-run prompt with the full expo-template-bare-minimum diff to upgrade native projects from SDK ${from} to SDK ${to}.`,
    '---',
    '',
    buildUpgradeInstructions(from, to),
    '',
    `${fence}diff`,
    diff,
    fence,
    '',
    buildUpgradeHelperAttribution(helperUrl),
    '',
  ].join('\n');
}

export function generateUpgradeDiffPages({
  outDir,
  diffInfo,
  includeUnversioned,
}: {
  outDir: string;
  diffInfo: UpgradeDiffInfo;
  includeUnversioned: boolean;
}): string[] {
  const pageDir = path.join(outDir, 'bare', 'upgrade');
  fs.mkdirSync(pageDir, { recursive: true });

  for (const entry of fs.readdirSync(pageDir, { withFileTypes: true })) {
    if (entry.isDirectory() && PAIR_DIR_PATTERN.test(entry.name)) {
      fs.rmSync(path.join(pageDir, entry.name), { recursive: true, force: true });
    } else if (entry.isFile() && LEGACY_FLAT_PAIR_FILE_PATTERN.test(entry.name)) {
      fs.unlinkSync(path.join(pageDir, entry.name));
    }
  }

  const written: string[] = [];
  for (const { from, to } of listUpgradePairs(diffInfo, { includeUnversioned })) {
    const pagePath = upgradeDiffPagePath(from, to);
    const markdown = buildUpgradeDiffMarkdown({ from, to, diff: diffInfo.diffs[`${from}..${to}`] });
    fs.mkdirSync(path.dirname(path.join(pageDir, pagePath)), { recursive: true });
    fs.writeFileSync(path.join(pageDir, pagePath), markdown);
    written.push(pagePath);
  }

  return written;
}
