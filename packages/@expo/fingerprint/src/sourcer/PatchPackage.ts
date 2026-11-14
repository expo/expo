import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { resolveWorkspaceRootAsync } from 'resolve-workspace-root';

import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
import {
  getNodeModulesPackageJsonPath,
  isIgnoredPathWithMatchObjects,
  pathExistsAsync,
  toPosixPath,
} from '../utils/Path';
import { getFileBasedHashSourceAsync, readPackageIdentityAsync } from './Utils';

const debug = require('debug')('expo:fingerprint:sourcer:PatchPackage');

export async function getPatchPackageSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions,
  packageSources: HashSource[] = []
): Promise<HashSource[]> {
  const sources = await getBunPatchSourcesAsync(projectRoot, options, packageSources);
  if (isIgnoredPathWithMatchObjects('patches', options.ignoreDirMatchObjects)) {
    debug(`Skipping dir - ${chalk.dim('patches')} (ignored by ignoreDirMatchObjects)`);
    return sources;
  }
  const result = await getFileBasedHashSourceAsync(projectRoot, 'patches', 'patchPackage');
  if (result != null) {
    debug(`Adding dir - ${chalk.dim('patches')}`);
    sources.push(result);
  }
  return sources;
}

async function getBunPatchSourcesAsync(
  projectRoot: string,
  options: NormalizedOptions,
  packageSources: HashSource[]
): Promise<HashSource[]> {
  if (!packageSources.length) {
    return [];
  }
  const root = (await resolveWorkspaceRootAsync(projectRoot)) ?? projectRoot;
  const bunLocks = await Promise.all(
    ['bun.lock', 'bun.lockb'].map((file) => pathExistsAsync(path.join(root, file)))
  );
  if (!bunLocks.some(Boolean)) {
    return [];
  }
  const { patchedDependencies } = JSON.parse(
    await fs.readFile(path.join(root, 'package.json'), 'utf8')
  );
  if (!patchedDependencies || typeof patchedDependencies !== 'object') {
    return [];
  }

  const identities = new Map<string, ReturnType<typeof readPackageIdentityAsync>>();
  const packages = new Set<string>();
  for (const source of packageSources) {
    if (
      source.type === 'contents' ||
      isIgnoredPathWithMatchObjects(source.filePath, options.ignorePathMatchObjects) ||
      (source.type === 'dir' &&
        isIgnoredPathWithMatchObjects(source.filePath, options.ignoreDirMatchObjects))
    ) {
      continue;
    }
    let identity;
    if (source.type === 'package') {
      identity = source;
    } else {
      const packageJson = getNodeModulesPackageJsonPath(source.filePath);
      if (!packageJson) {
        continue;
      }
      if (!identities.has(packageJson)) {
        identities.set(packageJson, readPackageIdentityAsync(path.join(projectRoot, packageJson)));
      }
      identity = await identities.get(packageJson);
    }
    if (identity) {
      packages.add(`${identity.name}@${identity.version}`);
    }
  }

  const sources: HashSource[] = [];
  for (const [name, patchPath] of Object.entries(patchedDependencies)) {
    if (!packages.has(name) || typeof patchPath !== 'string') {
      continue;
    }
    const filePath = toPosixPath(path.relative(projectRoot, path.resolve(root, patchPath)));
    // A file source must respect ignored parent directories, just like a directory traversal.
    let dir = path.posix.dirname(filePath);
    while (dir !== '.' && !isIgnoredPathWithMatchObjects(dir, options.ignoreDirMatchObjects)) {
      dir = path.posix.dirname(dir);
    }
    if (dir !== '.') {
      continue;
    }
    const source = await getFileBasedHashSourceAsync(
      projectRoot,
      filePath,
      'bun:patchedDependencies'
    );
    if (source) {
      sources.push(source);
    }
  }
  return sources;
}
