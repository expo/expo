import { SANDBOX_PRESETS } from './types';
import type { PullRequestRef, SandboxPreset } from './types';

const GITHUB_PULL_REQUEST_URL_PATTERN =
  /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/pull\/([1-9]\d*)(?:[/?#].*)?$/;
const REPO_PART_PATTERN = /^[A-Za-z0-9_.-]+$/;
const HEAD_SHA_PATTERN = /^[a-f0-9]{40}$/i;

export function parsePublicPullRequestUrl(prUrl: string): Omit<PullRequestRef, 'headSha'> {
  const match = prUrl.match(GITHUB_PULL_REQUEST_URL_PATTERN);
  if (!match) {
    throw new Error(
      'PR URL must be a public GitHub pull request URL like https://github.com/owner/repo/pull/123.'
    );
  }

  const [, owner, name, pullNumber] = match;
  return {
    owner,
    name,
    repo: `${owner}/${name}`,
    pullNumber: Number(pullNumber),
    prUrl,
  };
}

export function normalizeRepo(repo: string): { owner: string; name: string; repo: string } {
  const [owner, name, extra] = repo.split('/');
  if (extra || !owner || !name || !REPO_PART_PATTERN.test(owner) || !REPO_PART_PATTERN.test(name)) {
    throw new Error(
      'Repository must use the owner/name format and contain only GitHub-safe chars.'
    );
  }
  return { owner, name, repo: `${owner}/${name}` };
}

export function normalizeHeadSha(headSha: string): string {
  if (!HEAD_SHA_PATTERN.test(headSha)) {
    throw new Error('Head SHA must be a 40-character hexadecimal commit SHA.');
  }
  return headSha.toLowerCase();
}

export function normalizePullRequestRef(input: {
  prUrl?: string;
  repo?: string;
  pullNumber?: number | string;
  headSha: string;
}): PullRequestRef {
  const headSha = normalizeHeadSha(input.headSha);

  if (input.prUrl) {
    return {
      ...parsePublicPullRequestUrl(input.prUrl),
      headSha,
    };
  }

  if (!input.repo || input.pullNumber == null) {
    throw new Error('Either --pr-url or both --repo and --pull-number must be provided.');
  }

  const pullNumber = Number(input.pullNumber);
  if (!Number.isInteger(pullNumber) || pullNumber <= 0) {
    throw new Error('Pull number must be a positive integer.');
  }

  return {
    ...normalizeRepo(input.repo),
    pullNumber,
    headSha,
  };
}

export function validateSandboxPreset(preset: string): SandboxPreset {
  if (!SANDBOX_PRESETS.includes(preset as SandboxPreset)) {
    throw new Error(`Unsupported sandbox preset "${preset}".`);
  }
  return preset as SandboxPreset;
}

export function normalizeSandboxPath(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (
    !normalizedPath ||
    normalizedPath.startsWith('/') ||
    normalizedPath === '..' ||
    normalizedPath.startsWith('../') ||
    normalizedPath.includes('/../') ||
    normalizedPath.endsWith('/..')
  ) {
    throw new Error('Sandbox file paths must be relative paths within the checked-out repository.');
  }
  return normalizedPath;
}

export function createPrJobId(ref: PullRequestRef): string {
  const normalizedRepo = `${ref.owner}-${ref.name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `pr-${normalizedRepo}-${ref.pullNumber}-${ref.headSha.slice(0, 12)}`;
}
