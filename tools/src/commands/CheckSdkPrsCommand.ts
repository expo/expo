import { Command } from '@expo/commander';
import chalk from 'chalk';

import Git from '../Git';
import logger from '../Logger';
import { spawnJSONCommandAsync } from '../Utils';
import { getVersionsAsync, getSortedSdkVersionKeys, VersionsApiHost } from '../Versions';

type GhPr = {
  number: number;
  title: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  mergeCommit: { oid: string } | null;
  author: { login: string };
  mergedAt: string | null;
  updatedAt: string;
  reviewDecision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | '';
  url: string;
};

type ActionOptions = {
  all: boolean;
  links: boolean;
};

let linksEnabled = true;

function link(text: string, url: string): string {
  if (!linksEnabled) {
    return text;
  }
  // Lazy require so FORCE_HYPERLINK is set before supports-hyperlinks evaluates
  if (!process.env.FORCE_HYPERLINK) {
    process.env.FORCE_HYPERLINK = '1';
  }
  const terminalLink: typeof import('terminal-link') = require('terminal-link');
  return terminalLink(text, url, { fallback: false });
}

function parseSDKArg(sdk: string | undefined): string | null {
  if (!sdk) {
    return null;
  }
  const match = sdk.match(/^(?:sdk-)?(\d+)$/);
  return match ? match[1] : null;
}

function formatAge(mergedAt: string): string {
  const ms = Date.now() - new Date(mergedAt).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) {
    return 'today';
  }
  if (days === 1) {
    return '1d ago';
  }
  if (days < 30) {
    return `${days}d ago`;
  }
  return `${Math.floor(days / 7)}w ago`;
}

/**
 * Parses "Publish packages" commits on the SDK branch to build a set of
 * package directory names that have been published (e.g. "expo-camera", "@expo/cli").
 */
async function getPublishedPackages(ref: string): Promise<Map<string, string>> {
  // Use %H%n%b to get commit hash followed by body for each publish commit
  const { stdout } = await Git.runAsync([
    'log',
    ref,
    '--grep=Publish packages',
    '--pretty=format:%H%n%b',
  ]);
  // Map package name → most recent publish commit hash
  const published = new Map<string, string>();
  let currentHash = '';
  for (const line of stdout.split('\n')) {
    if (/^[0-9a-f]{40}$/.test(line)) {
      currentHash = line;
      continue;
    }
    // Lines look like: "expo-camera@55.0.9" or "@expo/cli@0.22.14"
    const match = line.match(/^(.+)@[\d.]+$/);
    if (match && currentHash) {
      // git log is newest-first; overwriting gives us the earliest publish per package
      published.set(match[1], currentHash);
    }
  }
  return published;
}

/**
 * Returns the set of package directory names touched by a merge commit.
 * Maps file paths like "packages/expo-camera/src/foo.ts" to "expo-camera",
 * and "packages/@expo/cli/src/bar.ts" to "@expo/cli".
 */
async function getPackagesTouchedByCommit(oid: string): Promise<Set<string>> {
  const { stdout } = await Git.runAsync(['diff-tree', '--no-commit-id', '-r', '--name-only', oid]);
  const packages = new Set<string>();
  for (const file of stdout.split('\n')) {
    // packages/expo-camera/... or packages/@expo/cli/...
    const match = file.match(/^packages\/((?:@[^/]+\/)?[^/]+)\//);
    if (match) {
      packages.add(match[1]);
    }
  }
  return packages;
}

type PublishInfo =
  | { status: 'published'; commitHash: string }
  | { status: 'unpublished' | 'no-packages' };

async function getPrPublishInfo(
  pr: GhPr,
  publishedPackages: Map<string, string>
): Promise<PublishInfo> {
  if (!pr.mergeCommit) {
    return { status: 'no-packages' };
  }
  const touched = await getPackagesTouchedByCommit(pr.mergeCommit.oid);
  if (touched.size === 0) {
    return { status: 'no-packages' };
  }
  const allPublished = [...touched].every((pkg) => publishedPackages.has(pkg));
  if (!allPublished) {
    return { status: 'unpublished' };
  }
  // Link to the first publish commit that included one of the touched packages
  const commitHash = [...touched].map((pkg) => publishedPackages.get(pkg)).find(Boolean)!;
  return { status: 'published', commitHash };
}

function formatPublishInfo(info: PublishInfo): string {
  switch (info.status) {
    case 'published':
      return link(
        chalk.green('published'),
        `https://github.com/expo/expo/commit/${info.commitHash}`
      );
    case 'unpublished':
      return chalk.dim('unpublished');
    case 'no-packages':
      return '';
  }
}

// Matches SGR codes (\x1b[...m) and OSC 8 hyperlinks (\x1b]8;;...\x07)
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m|\x1b\]8;;[^\x07]*\x07/g;

function pad(str: string, width: number): string {
  const visible = str.replace(ANSI_RE, '').length;
  return str + ' '.repeat(Math.max(0, width - visible));
}

function formatReviewDecision(decision: GhPr['reviewDecision']): string {
  switch (decision) {
    case 'APPROVED':
      return chalk.green('approved');
    case 'CHANGES_REQUESTED':
      return chalk.red('changes requested');
    case 'REVIEW_REQUIRED':
      return chalk.yellow('review needed');
    default:
      return '';
  }
}

function formatPrLine(pr: GhPr, publishInfo?: PublishInfo): string {
  const num = link(chalk.yellow(`#${pr.number}`), pr.url);
  const sha = pr.mergeCommit
    ? link(
        chalk.dim(pr.mergeCommit.oid.slice(0, 10)),
        `https://github.com/expo/expo/commit/${pr.mergeCommit.oid}`
      )
    : '';
  // For merged PRs: publish status. For open PRs: review decision.
  let status = '';
  if (pr.state === 'MERGED' && publishInfo) {
    status = formatPublishInfo(publishInfo);
  } else if (pr.state === 'OPEN') {
    status = formatReviewDecision(pr.reviewDecision);
  }
  const titleText = pr.title.length > 60 ? pr.title.slice(0, 57) + '...' : pr.title;
  const title = link(titleText, pr.url);
  const author = link(chalk.dim(`@${pr.author.login}`), `https://github.com/${pr.author.login}`);
  // For merged PRs show merge age, for open PRs show time since last activity
  const timestamp = pr.mergedAt ?? pr.updatedAt;
  const age = timestamp ? chalk.dim(formatAge(timestamp)) : '';
  return `  ${pad(num, 8)}  ${pad(sha, 10)}  ${pad(status, 17)}  ${pad(title, 60)}  ${pad(author, 20)}  ${age}`;
}

async function action(sdk: string | undefined, options: ActionOptions) {
  linksEnabled = options.links;

  // Resolve SDK version
  let sdkNumber = parseSDKArg(sdk);

  if (!sdkNumber) {
    const currentBranch = await Git.getCurrentBranchNameAsync();
    const branchMatch = currentBranch.match(/\bsdk-(\d+)$/);
    if (branchMatch) {
      sdkNumber = branchMatch[1];
    } else {
      // Not on an SDK branch — get the latest SDK version from the versions endpoint
      const versions = await getVersionsAsync(VersionsApiHost.PRODUCTION);
      const sorted = getSortedSdkVersionKeys(versions);

      if (sorted.length === 0) {
        throw new Error(
          `Could not detect SDK version. Pass it explicitly: ${chalk.bold('et csp 55')}`
        );
      }
      sdkNumber = sorted[0].split('.')[0];
      logger.info(`Detected latest SDK version: ${chalk.bold(sdkNumber)}`);
    }
  }

  const label = `sdk-${sdkNumber}`;
  const branch = `sdk-${sdkNumber}`;

  // Fetch PRs from GitHub
  logger.info(`Fetching PRs labeled ${chalk.bold(label)}...`);

  let prs: GhPr[];
  try {
    prs = await spawnJSONCommandAsync<GhPr[]>('gh', [
      'pr',
      'list',
      '--repo',
      'expo/expo',
      '--label',
      label,
      '--state',
      'all',
      '--json',
      'number,title,state,mergeCommit,author,mergedAt,updatedAt,reviewDecision,url',
      '--limit',
      '500',
    ]);
  } catch (error: any) {
    if (error.message?.includes('ENOENT') || error.message?.includes('not found')) {
      throw new Error(`GitHub CLI (gh) is not installed. Install it from https://cli.github.com/`);
    }
    throw error;
  }

  if (prs.length === 0) {
    logger.warn(`No PRs found with label ${chalk.bold(label)}.`);
    return;
  }

  const mergedPrs = prs.filter((pr) => pr.state === 'MERGED');
  const openPrs = prs.filter((pr) => pr.state === 'OPEN');
  const closedPrs = prs.filter((pr) => pr.state === 'CLOSED');

  // Fetch SDK branch
  logger.info(`Fetching ${chalk.bold(branch)} branch...`);
  await Git.fetchAsync({ remote: 'origin', ref: branch });

  // Determine which ref to compare against
  let ref = `origin/${branch}`;
  const localBranchExists = await Git.tryAsync(['rev-parse', '--verify', branch]);

  if (localBranchExists) {
    try {
      const { ahead } = await Git.compareBranchesAsync(branch, `origin/${branch}`);
      if (ahead > 0) {
        logger.warn(
          `Local branch ${chalk.bold(branch)} is ${ahead} commit${ahead === 1 ? '' : 's'} ahead of origin — comparing against local.`
        );
        ref = branch;
      }
    } catch {
      // If comparison fails, fall back to remote
    }
  }

  // Get all commit subjects from the SDK branch
  const { stdout } = await Git.runAsync(['log', ref, '--pretty=format:%s']);
  const cherryPickedPrs = new Set<number>();

  for (const line of stdout.split('\n')) {
    const match = line.match(/\(#(\d+)\)/);
    if (match) {
      cherryPickedPrs.add(Number(match[1]));
    }
  }

  const needsCherryPick = mergedPrs.filter((pr) => !cherryPickedPrs.has(pr.number));
  const alreadyCherryPicked = mergedPrs.filter((pr) => cherryPickedPrs.has(pr.number));

  // Determine publish status for cherry-picked PRs
  const publishedPackages = await getPublishedPackages(ref);
  const publishInfos = new Map<number, PublishInfo>();
  await Promise.all(
    alreadyCherryPicked.map(async (pr) => {
      publishInfos.set(pr.number, await getPrPublishInfo(pr, publishedPackages));
    })
  );

  // Sort by mergedAt descending (most recent first)
  needsCherryPick.sort((a, b) => new Date(b.mergedAt!).getTime() - new Date(a.mergedAt!).getTime());
  alreadyCherryPicked.sort(
    (a, b) => new Date(b.mergedAt!).getTime() - new Date(a.mergedAt!).getTime()
  );

  // Display results
  if (options.all) {
    if (needsCherryPick.length > 0) {
      logger.log('');
      logger.log(chalk.red.bold(`Needs Cherry-Pick (${needsCherryPick.length}):`));
      for (const pr of needsCherryPick) {
        logger.log(formatPrLine(pr, publishInfos.get(pr.number)));
      }
    }

    if (alreadyCherryPicked.length > 0) {
      logger.log('');
      logger.log(chalk.green.bold(`Already Cherry-Picked (${alreadyCherryPicked.length}):`));
      for (const pr of alreadyCherryPicked) {
        logger.log(formatPrLine(pr, publishInfos.get(pr.number)));
      }
    }

    if (openPrs.length > 0) {
      logger.log('');
      logger.log(chalk.blue.bold(`Open (${openPrs.length}):`));
      for (const pr of openPrs) {
        logger.log(formatPrLine(pr, publishInfos.get(pr.number)));
      }
    }

    if (closedPrs.length > 0) {
      logger.log('');
      logger.log(chalk.gray.bold(`Closed without Merge (${closedPrs.length}):`));
      for (const pr of closedPrs) {
        logger.log(formatPrLine(pr, publishInfos.get(pr.number)));
      }
    }
  } else {
    if (needsCherryPick.length === 0) {
      logger.success(
        `All merged PRs have been cherry-picked to ${chalk.bold(branch)}! (${mergedPrs.length} merged, ${openPrs.length} open)`
      );
      return;
    }

    logger.log('');
    logger.log(chalk.bold(`PRs that need cherry-picking to ${branch}:`));
    logger.log('');
    for (const pr of needsCherryPick) {
      logger.log(formatPrLine(pr, publishInfos.get(pr.number)));
    }
  }

  // Summary
  logger.log('');
  logger.log(
    chalk.dim(
      `${needsCherryPick.length} PR${needsCherryPick.length === 1 ? '' : 's'} need${needsCherryPick.length === 1 ? 's' : ''} cherry-picking (${mergedPrs.length} merged, ${openPrs.length} open)`
    )
  );
}

export default (program: Command) => {
  program
    .command('check-sdk-prs [sdk]')
    .alias('csp')
    .description(
      `Shows which PRs labeled for an SDK version still need cherry-picking to the SDK branch.

  If [sdk] is omitted, detects from the current branch (e.g. sdk-55) or falls back
  to the latest SDK version from the versions endpoint. Accepts "55" or "sdk-55".

  Cherry-pick detection: matches PR numbers in commit subjects (the "(#N)" suffix
  GitHub adds to squash-merge titles) against commits on the SDK branch.

  Publish detection: parses "Publish packages" commit bodies on the SDK branch to
  find which packages have been published, then checks which packages each PR touched.
  A PR is "published" if all packages it modified have appeared in a publish commit.`
    )
    .option('-a, --all', 'Show all PRs grouped by status', false)
    .option('--no-links', 'Disable clickable terminal hyperlinks')
    .asyncAction(action);
};
