import chalk from 'chalk';
import path from 'path';
import { resolveWorkspaceRootAsync } from 'resolve-workspace-root';

import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { isIgnoredPathWithMatchObjects, toPosixPath } from '../utils/Path';
import { getFileBasedHashSourceAsync } from './Utils';

const debug = require('debug')('expo:fingerprint:sourcer:PatchPackage');

const PATCHES_DIR_NAME = 'patches';

/**
 * `patch-package` and bun `patchedDependencies` read `patches/` from the workspace root.
 * That directory is outside `projectRoot` when the app is a package in a monorepo.
 */
export async function getPatchPackageSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashSource[]> {
  if (isIgnoredPathWithMatchObjects(PATCHES_DIR_NAME, options.ignoreDirMatchObjects)) {
    debug(`Skipping dir - ${chalk.dim(PATCHES_DIR_NAME)} (ignored by ignoreDirMatchObjects)`);
    return [];
  }

  const sources: HashSource[] = [];
  for (const relativePath of await getPatchDirectoryRelativePathsAsync(projectRoot)) {
    const result = await getFileBasedHashSourceAsync(projectRoot, relativePath, 'patchPackage');
    if (result != null) {
      debug(`Adding dir - ${chalk.dim(relativePath)}`);
      sources.push(result);
    }
  }
  return sources;
}

/**
 * Project `patches/` first, then the workspace-root `patches/` when that is a different directory.
 * A project that is already the workspace root contributes the directory once.
 */
async function getPatchDirectoryRelativePathsAsync(projectRoot: string): Promise<string[]> {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const projectPatches = path.join(resolvedProjectRoot, PATCHES_DIR_NAME);
  const patchDirectories = [projectPatches];
  const workspaceRoot = await resolveWorkspaceRootAsync(resolvedProjectRoot);
  if (workspaceRoot != null) {
    const workspacePatches = path.join(workspaceRoot, PATCHES_DIR_NAME);
    if (path.resolve(workspacePatches) !== path.resolve(projectPatches)) {
      patchDirectories.push(workspacePatches);
    }
  }

  const seen = new Set<string>();
  const relativePaths: string[] = [];
  for (const directory of patchDirectories) {
    const relativePath = toPosixPath(path.relative(resolvedProjectRoot, directory));
    if (seen.has(relativePath)) {
      continue;
    }
    seen.add(relativePath);
    relativePaths.push(relativePath);
  }
  return relativePaths;
}
