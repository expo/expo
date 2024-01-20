import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import { type Ora } from 'ora';
import os from 'os';
import path from 'path';

import { env } from './env';
import { fileExistsAsync, folderExistsAsync } from './fs';
import { type ExtractProps, extractLocalNpmTarballAsync, npmPackAsync } from './npm';
import { Log } from '../log';

const debug = require('debug')('expo:init:github') as typeof console.log;

/**
 * This GitHub URL pattern should only be applied to the pathname of a URL.
 * It matches the following patterns:
 *   - `github.com/<owner>/<name>` → [, owner, name]
 *   - `github.com/<owner>/<name>/tree/<ref>` → [, owner, name, ref]
 *   - `github.com/<owner>/<name>/tree/<ref>/<folder>` → [, owner, name, ref, folder]
 */
const GITHUB_URL_PATTERN = /([^\\/]+)\/([^\\/]+)(?:\/tree\/([^\\/]+)(?:\/(.*))?)?/;

type GitHubRepoInfo = {
  /** The full parsed GitHub URL */
  url: string;
  /** The owner of the repository */
  owner: string;
  /** The name of the repository */
  name: string;
  /** The git reference, either branch, tag, or commit */
  ref?: string;
  /** The (sub)folder of the repository to use */
  folder?: string;
};

/**
 * Parse a GitHub URL into the repository owner and name.
 * URLs may also contain a git reference, and possible (sub)folder.
 * The following URLs are supported:
 *   - `github.com/<owner>/<name>`
 *   - `github.com/<owner>/<name>/tree/<ref>`
 *   - `github.com/<owner>/<name>/tree/<ref>/<folder>`
 * @todo(cedric): add support for releases? https://github.com/expo/expo-github-action/archive/refs/tags/8.2.1.tar.gz
 */
export function getGithubUrlInfo(uri: string): GitHubRepoInfo | null {
  try {
    const { pathname } = new URL(uri, 'https://github.com');
    const [, owner, name, ref, folder] = pathname.match(GITHUB_URL_PATTERN) || [];

    if (owner && name) {
      return { url: uri, owner, name, ref, folder };
    }
  } catch {
    // Pass-through
  }

  return null;
}

function getTemporaryCacheFilePath(info: GitHubRepoInfo) {
  // This is cleared when the device restarts
  return path.join(
    os.tmpdir(),
    '.create-expo-app',
    'github-template-cache',
    info.owner,
    info.name,
    info.ref || '',
    info.folder || ''
  );
}

export async function downloadAndExtractGitHubRepositoryAsync(
  info: GitHubRepoInfo,
  props: ExtractProps & { spinner: Ora }
) {
  const cachePath = getTemporaryCacheFilePath(info);
  await fs.promises.mkdir(cachePath, { recursive: true });

  debug('Looking for GitHub repository:', info.url);

  // Clone the repository first, using the right ref if provided
  try {
    const fileExists = await fileExistsAsync(cachePath);
    if (env.EXPO_NO_CACHE || !fileExists) {
      props.spinner.text = 'Cloning GitHub repository';
      await cloneGitHubRepositoryAsync(info, cachePath);
    }
  } catch (error: unknown) {
    Log.error('Error cloning GitHub repository: ' + info.url);
    throw error;
  }

  // Locate the subfolder to use as template
  let templatePath = cachePath;
  if (info.folder) {
    templatePath = path.join(cachePath, info.folder);
    if (!(await folderExistsAsync(templatePath))) {
      debug('Could not find folder:', templatePath);
      throw new Error(`Could not find folder ${info.folder} in cloned GitHub repository`);
    }
  }

  // Create a new tarball from template folder
  props.spinner.text = 'Creating template from GitHub repository';
  const tarballInfo = await npmPackAsync('.', templatePath);
  const tarballFile = tarballInfo?.[0].filename;
  if (!tarballFile) {
    throw new Error('Could not create tarball from GitHub repository');
  }

  try {
    await extractLocalNpmTarballAsync(path.join(templatePath, tarballFile), {
      cwd: props.cwd,
      name: props.name,
    });
  } finally {
    await fs.promises.rm(path.join(templatePath, tarballFile), { force: true });
  }
}

async function cloneGitHubRepositoryAsync(info: GitHubRepoInfo, dir: string) {
  // Force clean this directory before cloning
  await fs.promises.rm(dir, { recursive: true, force: true });
  await fs.promises.mkdir(dir, { recursive: true });

  const cloneArgs = [
    'clone',
    `git@github.com:${info.owner}/${info.name}.git`,
    dir,
    '--depth=1',
    '--single-branch',
  ];
  if (info.ref) {
    cloneArgs.push('--branch', info.ref);
  }

  debug('Cloning GitHub repository: git', cloneArgs.join(' '));

  await spawnAsync('git', cloneArgs, { stdio: env.EXPO_DEBUG ? 'inherit' : 'ignore' });
  // TODO: error handling
}
