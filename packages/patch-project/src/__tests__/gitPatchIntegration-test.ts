import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { applyPatchAsync, getPatchChangedLinesAsync, isPatchAppliedAsync } from '../gitPatch';

// These tests run real `git` against real directories, so that they cover what the argv assertions
// in `gitPatch-test.ts` cannot: whether a patch actually lands in the native project.

const INFO_PLIST_PATH = path.join('ios', 'Info.plist');

const ORIGINAL_CONTENTS = ['<plist>', '<dict>', '</plist>', ''].join('\n');
const PATCHED_CONTENTS = ['<plist>', '<key>PatchedKey</key>', '<dict>', '</plist>', ''].join('\n');

// A patch as `patchProjectAsync` generates it: paths are relative to the native project.
const PATCH_CONTENTS = [
  'diff --git a/ios/Info.plist b/ios/Info.plist',
  '--- a/ios/Info.plist',
  '+++ b/ios/Info.plist',
  '@@ -1,3 +1,4 @@',
  ' <plist>',
  '+<key>PatchedKey</key>',
  ' <dict>',
  ' </plist>',
  '',
].join('\n');

async function createProjectAsync(projectRoot: string): Promise<string> {
  await fs.mkdir(path.join(projectRoot, 'ios'), { recursive: true });
  await fs.writeFile(path.join(projectRoot, INFO_PLIST_PATH), ORIGINAL_CONTENTS, 'utf8');

  const patchFilePath = path.join(projectRoot, 'cng-patches', 'ios+checksum.patch');
  await fs.mkdir(path.dirname(patchFilePath), { recursive: true });
  await fs.writeFile(patchFilePath, PATCH_CONTENTS, 'utf8');
  return patchFilePath;
}

async function initRepositoryAsync(repoRoot: string): Promise<void> {
  await spawnAsync('git', ['init'], { cwd: repoRoot });
}

async function readInfoPlistAsync(projectRoot: string): Promise<string> {
  const contents = await fs.readFile(path.join(projectRoot, INFO_PLIST_PATH), 'utf8');
  // `git apply` writes CRLF when global `core.autocrlf` is true, the Git for Windows default.
  return contents.replace(/\r\n/g, '\n');
}

describe('gitPatch against real repositories', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-project-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should apply a patch to a project nested in a monorepo', async () => {
    const projectRoot = path.join(tmpDir, 'apps', 'mobile');
    const patchFilePath = await createProjectAsync(projectRoot);
    // The repository root is the monorepo root, not the project.
    await initRepositoryAsync(tmpDir);

    await expect(isPatchAppliedAsync(projectRoot, patchFilePath)).resolves.toBe(false);
    await expect(getPatchChangedLinesAsync(projectRoot, patchFilePath)).resolves.toBe(1);

    await applyPatchAsync(projectRoot, patchFilePath);

    await expect(readInfoPlistAsync(projectRoot)).resolves.toBe(PATCHED_CONTENTS);
    await expect(isPatchAppliedAsync(projectRoot, patchFilePath)).resolves.toBe(true);
  });

  it('should apply a patch when the project is the repository root', async () => {
    const patchFilePath = await createProjectAsync(tmpDir);
    await initRepositoryAsync(tmpDir);

    await expect(isPatchAppliedAsync(tmpDir, patchFilePath)).resolves.toBe(false);
    await expect(getPatchChangedLinesAsync(tmpDir, patchFilePath)).resolves.toBe(1);

    await applyPatchAsync(tmpDir, patchFilePath);

    await expect(readInfoPlistAsync(tmpDir)).resolves.toBe(PATCHED_CONTENTS);
    await expect(isPatchAppliedAsync(tmpDir, patchFilePath)).resolves.toBe(true);
  });

  it('should apply a patch when the project is not inside a repository', async () => {
    const patchFilePath = await createProjectAsync(tmpDir);

    await expect(isPatchAppliedAsync(tmpDir, patchFilePath)).resolves.toBe(false);
    await expect(getPatchChangedLinesAsync(tmpDir, patchFilePath)).resolves.toBe(1);

    await applyPatchAsync(tmpDir, patchFilePath);

    await expect(readInfoPlistAsync(tmpDir)).resolves.toBe(PATCHED_CONTENTS);
    await expect(isPatchAppliedAsync(tmpDir, patchFilePath)).resolves.toBe(true);
  });

  it('should leave the project untouched when the patch does not apply', async () => {
    const projectRoot = path.join(tmpDir, 'apps', 'mobile');
    const patchFilePath = await createProjectAsync(projectRoot);
    await initRepositoryAsync(tmpDir);
    await fs.writeFile(path.join(projectRoot, INFO_PLIST_PATH), '<plist>\n</plist>\n', 'utf8');

    await expect(applyPatchAsync(projectRoot, patchFilePath)).rejects.toThrow();
    await expect(readInfoPlistAsync(projectRoot)).resolves.toBe('<plist>\n</plist>\n');
  });
});
