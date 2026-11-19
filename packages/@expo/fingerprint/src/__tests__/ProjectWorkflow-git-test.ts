import { execFileSync } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { resolveProjectWorkflowAsync } from '../ProjectWorkflow';

// This is an integration test against real git repositories on disk, so opt out of the
// automatic `resolve-from` mock from `__mocks__/` and use the real module resolution.
jest.unmock('resolve-from');

// Path to the `expo` package inside this monorepo, symlinked into the temporary project so
// `expo/config-plugins` is resolvable from the project root.
const EXPO_PACKAGE_ROOT = path.resolve(__dirname, '..', '..', '..', '..', 'expo');

describe('resolveProjectWorkflowAsync - resolves the git root of the project, not of the caller cwd', () => {
  let tmpDir: string;
  let projectRoot: string;
  let otherRepoRoot: string;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    // Use the realpath so that symlinked temp dirs (e.g. /var -> /private/var on macOS)
    // don't interfere with path comparisons.
    tmpDir = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'fingerprint-git-'));
    projectRoot = path.join(tmpDir, 'project');
    otherRepoRoot = path.join(tmpDir, 'other-repo');

    // The project we fingerprint: a git repo whose native ios directory is gitignored,
    // which makes it a managed workflow project.
    await fs.mkdir(path.join(projectRoot, 'ios', 'app.xcodeproj'), { recursive: true });
    await fs.writeFile(path.join(projectRoot, 'ios', 'app.xcodeproj', 'project.pbxproj'), '');
    await fs.writeFile(path.join(projectRoot, '.gitignore'), 'ios\n');
    await fs.mkdir(path.join(projectRoot, 'node_modules'), { recursive: true });
    await fs.symlink(EXPO_PACKAGE_ROOT, path.join(projectRoot, 'node_modules', 'expo'));
    execFileSync('git', ['init'], { cwd: projectRoot });

    // An unrelated git repo where the caller's cwd sits, e.g. running a tool from another
    // project or from the main checkout while fingerprinting a git worktree.
    await fs.mkdir(otherRepoRoot, { recursive: true });
    execFileSync('git', ['init'], { cwd: otherRepoRoot });
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns managed workflow when cwd is inside another git repo', async () => {
    // The bug: the git root was resolved from the caller's cwd instead of the project root,
    // so the gitignored ios directory was not detected and the workflow flipped to generic.
    process.chdir(otherRepoRoot);
    await expect(resolveProjectWorkflowAsync(projectRoot, 'ios', [])).resolves.toBe('managed');
  });

  it('returns managed workflow when cwd is the project root', async () => {
    process.chdir(projectRoot);
    await expect(resolveProjectWorkflowAsync(projectRoot, 'ios', [])).resolves.toBe('managed');
  });
});
