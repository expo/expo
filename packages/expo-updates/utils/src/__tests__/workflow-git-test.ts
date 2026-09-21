import { execFileSync } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { resolveWorkflowAsync } from '../workflow';

describe('resolveWorkflowAsync - resolves the git root of the project, not of the caller cwd', () => {
  let tmpDir: string;
  let projectDir: string;
  let otherRepoRoot: string;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    // Use the realpath so that symlinked temp dirs (/var -> /private/var) don't interfere.
    tmpDir = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'expo-updates-git-'));
    projectDir = path.join(tmpDir, 'project');
    otherRepoRoot = path.join(tmpDir, 'other-repo');

    // A git repo whose gitignored native directory makes it a managed workflow project.
    await fs.mkdir(path.join(projectDir, 'ios', 'app.xcodeproj'), { recursive: true });
    await fs.writeFile(path.join(projectDir, 'ios', 'app.xcodeproj', 'project.pbxproj'), '');
    await fs.writeFile(path.join(projectDir, '.gitignore'), 'ios\n');
    execFileSync('git', ['init'], { cwd: projectDir });

    // An unrelated repo to run from, like a monorepo root building one of its apps.
    await fs.mkdir(otherRepoRoot, { recursive: true });
    execFileSync('git', ['init'], { cwd: otherRepoRoot });
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns managed workflow when cwd is inside another git repo', async () => {
    process.chdir(otherRepoRoot);
    await expect(resolveWorkflowAsync(projectDir, 'ios')).resolves.toBe('managed');
  });

  it('returns managed workflow when cwd is the project directory', async () => {
    process.chdir(projectDir);
    await expect(resolveWorkflowAsync(projectDir, 'ios')).resolves.toBe('managed');
  });
});
