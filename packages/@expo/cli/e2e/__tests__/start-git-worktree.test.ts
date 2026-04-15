/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { setupTestProjectWithOptionsAsync, getHtml } from './utils';
import { createExpoStart } from '../utils/expo';
import { executeAsync } from '../utils/process';

/** Run a git command, ignoring failures (for idempotent cleanup). */
function gitSafe(cwd: string, args: string[]) {
  return executeAsync(cwd, args, { command: ['git'], verbose: false }).catch(() => {});
}

describe('git worktree web support', () => {
  let projectRoot: string;
  let worktreeRoot: string;

  const BRANCH_NAME = 'test-worktree-branch';

  beforeAll(async () => {
    projectRoot = await setupTestProjectWithOptionsAsync('git-worktree-test', 'with-router');
    worktreeRoot = path.join(projectRoot, '.worktrees', 'test-branch');

    // Initialize git if needed
    if (!fs.existsSync(path.join(projectRoot, '.git'))) {
      await executeAsync(projectRoot, ['init'], { command: ['git'] });
    }

    // Clean up any stale worktree/branch from previous runs
    await gitSafe(projectRoot, ['worktree', 'remove', worktreeRoot, '--force']);
    await gitSafe(projectRoot, ['worktree', 'prune']);
    await gitSafe(projectRoot, ['branch', '-D', BRANCH_NAME]);

    // Ensure at least one commit exists
    await executeAsync(projectRoot, ['add', '.'], { command: ['git'] });
    await gitSafe(projectRoot, [
      '-c', 'user.name=test', '-c', 'user.email=test@test.com',
      'commit', '-m', 'initial', '--allow-empty', '--no-gpg-sign',
    ]);

    // Create a worktree in a nested subdirectory.
    // This simulates the real-world scenario where worktrees are nested deep
    // (e.g. .claude/worktrees/branch-name/) — the depth causes serverRoot
    // to be above node_modules, producing broken "../" URLs.
    fs.mkdirSync(path.dirname(worktreeRoot), { recursive: true });
    await executeAsync(
      projectRoot,
      ['worktree', 'add', worktreeRoot, '-b', BRANCH_NAME],
      { command: ['git'] }
    );

    // node_modules is not tracked by git, so symlink it into the worktree
    const worktreeNodeModules = path.join(worktreeRoot, 'node_modules');
    if (!fs.existsSync(worktreeNodeModules)) {
      fs.symlinkSync(path.join(projectRoot, 'node_modules'), worktreeNodeModules);
    }
  });

  afterAll(async () => {
    if (worktreeRoot) {
      await gitSafe(projectRoot, ['worktree', 'remove', worktreeRoot, '--force']);
      await gitSafe(projectRoot, ['branch', '-D', BRANCH_NAME]);
    }
  });

  it('serves working script URLs in static single mode from a git worktree', async () => {
    const expo = createExpoStart({
      cwd: worktreeRoot,
      env: {
        NODE_ENV: 'development',
        E2E_USE_STATIC: 'single',
        CI: '1',
      },
    });

    try {
      await expo.startAsync();

      // Fetch the root HTML page — in single mode this is a small shell (~1 KB)
      const response = await expo.fetchAsync('/');
      expect(response.status).toBe(200);

      const html = await response.text();
      const doc = getHtml(html);

      // Get all script tags with src attributes
      const scripts = doc
        .querySelectorAll('script')
        .filter((s) => !!s.attributes.src)
        .map((s) => s.attributes.src!);

      expect(scripts.length).toBeGreaterThan(0);

      // The bug: when running from a git worktree, the serverRoot resolves to a
      // workspace root above the project. The entry URL is computed relative to
      // serverRoot, producing leading "../" segments. URL normalization collapses
      // those leading segments, so the browser requests /node_modules/... instead
      // of /../../../node_modules/..., and Metro can't resolve the module.
      for (const src of scripts) {
        expect(src).not.toMatch(/\.\.\//);
      }
    } finally {
      await expo.stopAsync();
    }
  });
});
