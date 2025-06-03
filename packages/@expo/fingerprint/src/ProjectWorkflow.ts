import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import { glob } from 'glob';
import createIgnore, { Ignore as SingleFileIgnore } from 'ignore';
import { type Minimatch } from 'minimatch';
import path from 'path';

import { resolveExpoConfigPluginsPackagePath } from './ExpoResolver';
import { type Platform, type ProjectWorkflow } from './Fingerprint.types';
import { isIgnoredPathWithMatchObjects, pathExistsAsync } from './utils/Path';

/**
 * Replicated project workflow detection logic from eas-cli:
 * https://github.com/expo/eas-cli/blob/25cc5551899d1ed03a09e04fd5f13a9ad485bd3a/packages/eas-cli/src/project/workflow.ts
 */

export async function resolveProjectWorkflowAsync(
  projectRoot: string,
  platform: Platform,
  fingerprintIgnorePaths: Minimatch[]
): Promise<ProjectWorkflow> {
  const configPluginsPackageRoot = resolveExpoConfigPluginsPackagePath(projectRoot);
  if (configPluginsPackageRoot == null) {
    return 'unknown';
  }
  const { AndroidConfig, IOSConfig } = require(configPluginsPackageRoot);

  let platformWorkflowMarkers: string[];
  try {
    platformWorkflowMarkers =
      platform === 'android'
        ? [
            path.join(projectRoot, 'android/app/build.gradle'),
            await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot),
          ]
        : [IOSConfig.Paths.getPBXProjectPath(projectRoot)];
  } catch {
    return 'managed';
  }

  const vcsClient = await getVCSClientAsync(projectRoot);
  const vcsRoot = path.normalize(await vcsClient.getRootPathAsync());
  for (const marker of platformWorkflowMarkers) {
    const relativeMarker = path.relative(vcsRoot, marker);
    if (
      (await pathExistsAsync(marker)) &&
      !isIgnoredPathWithMatchObjects(relativeMarker, fingerprintIgnorePaths) &&
      !(await vcsClient.isFileIgnoredAsync(relativeMarker))
    ) {
      return 'generic';
    }
  }
  return 'managed';
}

export async function resolveProjectWorkflowPerPlatformAsync(
  projectRoot: string,
  fingerprintIgnorePaths: Minimatch[]
): Promise<Record<Platform, ProjectWorkflow>> {
  const [android, ios] = await Promise.all([
    resolveProjectWorkflowAsync(projectRoot, 'android', fingerprintIgnorePaths),
    resolveProjectWorkflowAsync(projectRoot, 'ios', fingerprintIgnorePaths),
  ]);
  return { android, ios };
}

//#region - a copy of ignore handler from eas-cli

interface VCSClient {
  getRootPathAsync(): Promise<string>;
  isFileIgnoredAsync(filePath: string): Promise<boolean>;
}

async function getVCSClientAsync(projectRoot: string): Promise<VCSClient> {
  if (await isGitInstalledAndConfiguredAsync()) {
    return new GitClient();
  } else {
    return new NoVCSClient(projectRoot);
  }
}

async function isFileIgnoredByEasIgnoreAsync(
  projectRoot: string,
  filePath: string
): Promise<boolean | undefined> {
  const easIgnorePath = path.join(projectRoot, EASIGNORE_FILENAME);
  if (await pathExistsAsync(easIgnorePath)) {
    const ignore = new Ignore(projectRoot);
    await ignore.initIgnoreWithEasIgnoreAsync(await fs.readFile(easIgnorePath, 'utf-8'));
    return ignore.ignores(filePath);
  }
  return undefined;
}

class GitClient implements VCSClient {
  public async getRootPathAsync(): Promise<string> {
    return (await spawnAsync('git', ['rev-parse', '--show-toplevel'])).stdout.trim();
  }

  async isFileIgnoredAsync(filePath: string): Promise<boolean> {
    const ignoredByEasIgnore = await isFileIgnoredByEasIgnoreAsync(
      await this.getRootPathAsync(),
      filePath
    );
    if (ignoredByEasIgnore !== undefined) {
      return ignoredByEasIgnore;
    }

    try {
      await spawnAsync('git', ['check-ignore', '-q', filePath], {
        cwd: path.normalize(await this.getRootPathAsync()),
      });
      return true;
    } catch {
      return false;
    }
  }
}

class NoVCSClient implements VCSClient {
  constructor(private readonly projectRoot: string) {}

  async getRootPathAsync(): Promise<string> {
    return this.projectRoot;
  }

  async isFileIgnoredAsync(filePath: string): Promise<boolean> {
    const ignoredByEasIgnore = await isFileIgnoredByEasIgnoreAsync(
      await this.getRootPathAsync(),
      filePath
    );
    if (ignoredByEasIgnore !== undefined) {
      return ignoredByEasIgnore;
    }

    const ignore = new Ignore(this.projectRoot);
    await ignore.initIgnoreAsync();
    return ignore.ignores(filePath);
  }
}

async function isGitInstalledAndConfiguredAsync(): Promise<boolean> {
  try {
    await spawnAsync('git', ['--help']);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }

  try {
    await spawnAsync('git', ['rev-parse', '--show-toplevel']);
  } catch {
    return false;
  }

  return true;
}

const EASIGNORE_FILENAME = '.easignore';
const GITIGNORE_FILENAME = '.gitignore';
const DEFAULT_IGNORE = `
.git
node_modules
`;

/**
 * Ignore wraps the 'ignore' package to support multiple .gitignore files
 * in subdirectories.
 *
 * Inconsistencies with git behavior:
 * - if parent .gitignore has ignore rule and child has exception to that rule,
 *   file will still be ignored,
 * - node_modules is always ignored
 *
 * Differs from the eas-cli Ignore class by not using `.easignore`. Otherwise this is copied. May try
 * to merge the implementations soon.
 */
class Ignore {
  private ignoreMapping: (readonly [string, SingleFileIgnore])[] = [];

  constructor(private rootDir: string) {}

  public async initIgnoreWithEasIgnoreAsync(easIgnoreContent: string): Promise<void> {
    this.ignoreMapping = [
      ['', createIgnore().add(DEFAULT_IGNORE)],
      ['', createIgnore().add(easIgnoreContent)],
    ];
  }

  public async initIgnoreAsync(): Promise<void> {
    const ignoreFilePaths = (
      await glob(`**/${GITIGNORE_FILENAME}`, {
        cwd: this.rootDir,
        ignore: ['node_modules'],
        follow: false,
      })
    )
      // ensure that parent dir is before child directories
      .sort((a, b) => a.length - b.length && a.localeCompare(b));

    const ignoreMapping = await Promise.all(
      ignoreFilePaths.map(async (filePath) => {
        return [
          filePath.slice(0, filePath.length - GITIGNORE_FILENAME.length),
          createIgnore().add(await fs.readFile(path.join(this.rootDir, filePath), 'utf-8')),
        ] as const;
      })
    );
    this.ignoreMapping = [['', createIgnore().add(DEFAULT_IGNORE)], ...ignoreMapping];
  }

  public ignores(relativePath: string): boolean {
    for (const [prefix, ignore] of this.ignoreMapping) {
      if (relativePath.startsWith(prefix) && ignore.ignores(relativePath.slice(prefix.length))) {
        return true;
      }
    }
    return false;
  }
}

//#endregion - a copy of ignore handler from eas-cli
