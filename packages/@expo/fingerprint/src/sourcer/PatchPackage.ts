import chalk from 'chalk';
import fs from 'fs/promises';
import { Minimatch } from 'minimatch';
import path from 'path';

import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import { isIgnoredPathWithMatchObjects, toPosixPath } from '../utils/Path';
import { getFileBasedHashSourceAsync } from './Utils';

const debug = require('debug')('expo:fingerprint:sourcer:PatchPackage');

const PATCHES_DIR_NAME = 'patches';
const PNPM_WORKSPACE_FILENAME = 'pnpm-workspace.yaml';

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
  const workspaceRoot = await findWorkspaceRootAsync(resolvedProjectRoot);
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

/**
 * Nearest workspace root that contains `directory`, for bun, npm, pnpm, and yarn.
 * Returns null when `directory` is not a member of a parent workspace.
 */
async function findWorkspaceRootAsync(directory: string): Promise<string | null> {
  const startingDir = path.resolve(directory);
  let currentDir = startingDir;
  while (true) {
    const relativeDir = toPosixPath(path.relative(currentDir, startingDir));
    const pnpmGlobs = await readPnpmWorkspaceGlobsAsync(currentDir);
    if (pnpmGlobs != null && relativePathMatchesWorkspaceGlobs(pnpmGlobs, relativeDir)) {
      return currentDir;
    }
    const packageGlobs = await readPackageWorkspaceGlobsAsync(currentDir);
    if (packageGlobs != null && relativePathMatchesWorkspaceGlobs(packageGlobs, relativeDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

function relativePathMatchesWorkspaceGlobs(globs: string[], relativePath: string): boolean {
  // An empty relative path means `directory` is the workspace root itself.
  if (relativePath === '') {
    return true;
  }
  return globs.some((glob) => globMatches(glob, relativePath));
}

function globMatches(glob: string, relativePath: string): boolean {
  try {
    return new Minimatch(toPosixPath(glob), { dot: true }).match(relativePath);
  } catch {
    return false;
  }
}

async function readPackageWorkspaceGlobsAsync(directory: string): Promise<string[] | null> {
  const packageJson = await readJsonFileAsync(path.join(directory, 'package.json'));
  if (packageJson == null || typeof packageJson !== 'object') {
    return null;
  }
  const workspaces = (packageJson as { workspaces?: unknown }).workspaces;
  if (Array.isArray(workspaces)) {
    return stringGlobs(workspaces);
  }
  if (workspaces != null && typeof workspaces === 'object') {
    return stringGlobs((workspaces as { packages?: unknown }).packages);
  }
  return null;
}

async function readPnpmWorkspaceGlobsAsync(directory: string): Promise<string[] | null> {
  let content: string;
  try {
    content = await fs.readFile(path.join(directory, PNPM_WORKSPACE_FILENAME), 'utf8');
  } catch {
    return null;
  }
  return workspaceGlobsFromPnpm(content);
}

/**
 * Read the `packages` list from a `pnpm-workspace.yaml` file.
 * Only the standard block list and a single-line flow sequence are recognized.
 */
function workspaceGlobsFromPnpm(content: string): string[] | null {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      continue;
    }
    const header = line.match(/^packages:\s*(.*?)\s*(?:#.*)?$/);
    const inline = header?.[1]?.trim();
    if (header == null || inline == null) {
      continue;
    }
    if (inline === '') {
      return readPnpmPackageBlock(lines.slice(index + 1));
    }
    if (inline.startsWith('[')) {
      return readPnpmFlowSequence(inline);
    }
    return null;
  }
  return null;
}

function readPnpmPackageBlock(lines: string[]): string[] | null {
  const globs: string[] = [];
  for (const line of lines) {
    if (line.trim() === '' || /^\s*#/.test(line)) {
      continue;
    }
    if (/^\S/.test(line)) {
      break;
    }
    const scalar = line.match(/^\s*-\s+(.+)$/)?.[1];
    if (scalar == null) {
      continue;
    }
    const glob = unquoteYamlScalar(scalar);
    if (glob.length > 0) {
      globs.push(glob);
    }
  }
  return globs.length > 0 ? globs : null;
}

function readPnpmFlowSequence(inline: string): string[] | null {
  const body = inline.replace(/^\[/, '').replace(/\]\s*$/, '');
  const globs = body
    .split(',')
    .map((part) => unquoteYamlScalar(part))
    .filter((part) => part.length > 0);
  return globs.length > 0 ? globs : null;
}

function unquoteYamlScalar(value: string): string {
  const withoutComment = value.replace(/\s+#.*$/, '').trim();
  if (
    (withoutComment.startsWith("'") && withoutComment.endsWith("'")) ||
    (withoutComment.startsWith('"') && withoutComment.endsWith('"'))
  ) {
    return withoutComment.slice(1, -1);
  }
  return withoutComment;
}

function stringGlobs(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const globs = value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  return globs.length > 0 ? globs : null;
}

async function readJsonFileAsync(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}
