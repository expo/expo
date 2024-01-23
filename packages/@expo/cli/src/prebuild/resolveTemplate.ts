import { ExpoConfig } from '@expo/config';
import assert from 'assert';
import chalk from 'chalk';
import fs from 'fs';
import { Ora } from 'ora';
import path from 'path';
import semver from 'semver';

import { fetchAsync } from '../api/rest/client';
import * as Log from '../log';
import { createGlobFilter } from '../utils/createFileTransform';
import { AbortCommandError, CommandError } from '../utils/errors';
import {
  ExtractProps,
  downloadAndExtractNpmModuleAsync,
  extractLocalNpmTarballAsync,
  extractNpmTarballFromUrlAsync,
} from '../utils/npm';
import { isUrlOk } from '../utils/url';

const debug = require('debug')('expo:prebuild:resolveTemplate') as typeof console.log;

type RepoInfo = {
  username: string;
  name: string;
  branch: string;
  filePath: string;
};

export async function cloneTemplateAsync({
  templateDirectory,
  template,
  exp,
  ora,
}: {
  templateDirectory: string;
  template?: string;
  exp: Pick<ExpoConfig, 'name' | 'sdkVersion'>;
  ora: Ora;
}): Promise<string> {
  if (template) {
    return await resolveTemplateArgAsync(templateDirectory, ora, exp.name, template);
  } else {
    const templatePackageName = await getTemplateNpmPackageName(exp.sdkVersion);
    return await downloadAndExtractNpmModuleAsync(templatePackageName, {
      cwd: templateDirectory,
      name: exp.name,
    });
  }
}

/** Given an `sdkVersion` like `44.0.0` return a fully qualified NPM package name like: `expo-template-bare-minimum@sdk-44` */
function getTemplateNpmPackageName(sdkVersion?: string): string {
  // When undefined or UNVERSIONED, we use the latest version.
  if (!sdkVersion || sdkVersion === 'UNVERSIONED') {
    Log.log('Using an unspecified Expo SDK version. The latest template will be used.');
    return `expo-template-bare-minimum@latest`;
  }
  return `expo-template-bare-minimum@sdk-${semver.major(sdkVersion)}`;
}

async function getRepoInfo(url: any, examplePath?: string): Promise<RepoInfo | undefined> {
  const [, username, name, t, _branch, ...file] = url.pathname.split('/');
  const filePath = examplePath ? examplePath.replace(/^\//, '') : file.join('/');

  // Support repos whose entire purpose is to be an example, e.g.
  // https://github.com/:username/:my-cool-example-repo-name.
  if (t === undefined) {
    const infoResponse = await fetchAsync(`https://api.github.com/repos/${username}/${name}`);
    if (infoResponse.status !== 200) {
      return;
    }
    const info = await infoResponse.json();
    return { username, name, branch: info['default_branch'], filePath };
  }

  // If examplePath is available, the branch name takes the entire path
  const branch = examplePath
    ? `${_branch}/${file.join('/')}`.replace(new RegExp(`/${filePath}|/$`), '')
    : _branch;

  if (username && name && branch && t === 'tree') {
    return { username, name, branch, filePath };
  }
  return undefined;
}

function hasRepo({ username, name, branch, filePath }: RepoInfo) {
  const contentsUrl = `https://api.github.com/repos/${username}/${name}/contents`;
  const packagePath = `${filePath ? `/${filePath}` : ''}/package.json`;

  return isUrlOk(contentsUrl + packagePath + `?ref=${branch}`);
}

async function downloadAndExtractRepoAsync(
  { username, name, branch, filePath }: RepoInfo,
  props: ExtractProps
): Promise<string> {
  const url = `https://codeload.github.com/${username}/${name}/tar.gz/${branch}`;

  debug('Downloading tarball from:', url);

  // Extract the (sub)directory into non-empty path segments
  const directory = filePath.replace(/^\//, '').split('/').filter(Boolean);
  // Remove the (sub)directory paths, and the root folder added by GitHub
  const strip = directory.length + 1;
  // Only extract the relevant (sub)directories, ignoring irrelevant files
  // The filder auto-ignores dotfiles, unless explicitly included
  const filter = createGlobFilter(
    !directory.length
      ? ['*/**', '*/ios/.xcode.env']
      : [`*/${directory.join('/')}/**`, `*/${directory.join('/')}/ios/.xcode.env`],
    {
      // Always ignore the `.xcworkspace` folder
      ignore: ['**/ios/*.xcworkspace/**'],
    }
  );

  return await extractNpmTarballFromUrlAsync(url, { ...props, strip, filter });
}

export async function resolveTemplateArgAsync(
  templateDirectory: string,
  oraInstance: Ora,
  appName: string,
  template: string,
  templatePath?: string
): Promise<string> {
  assert(template, 'template is required');

  let repoUrl: URL | undefined;

  try {
    repoUrl = new URL(template);
  } catch (error: any) {
    if (error.code !== 'ERR_INVALID_URL') {
      oraInstance.fail(error);
      throw error;
    }
  }

  // On Windows, we can actually create a URL from a local path
  // Double-check if the created URL is not a path to avoid mixing up URLs and paths
  if (process.platform === 'win32' && repoUrl && path.isAbsolute(repoUrl.toString())) {
    repoUrl = undefined;
  }

  if (!repoUrl) {
    const templatePath = path.resolve(template);
    if (!fs.existsSync(templatePath)) {
      throw new CommandError(`template file does not exist: ${templatePath}`);
    }

    return await extractLocalNpmTarballAsync(templatePath, {
      cwd: templateDirectory,
      name: appName,
    });
  }

  if (repoUrl.origin !== 'https://github.com') {
    oraInstance.fail(
      `Invalid URL: ${chalk.red(
        `"${template}"`
      )}. Only GitHub repositories are supported. Please use a GitHub URL and try again.`
    );
    throw new AbortCommandError();
  }

  const repoInfo = await getRepoInfo(repoUrl, templatePath);

  if (!repoInfo) {
    oraInstance.fail(
      `Found invalid GitHub URL: ${chalk.red(`"${template}"`)}. Please fix the URL and try again.`
    );
    throw new AbortCommandError();
  }

  const found = await hasRepo(repoInfo);

  if (!found) {
    oraInstance.fail(
      `Could not locate the repository for ${chalk.red(
        `"${template}"`
      )}. Please check that the repository exists and try again.`
    );
    throw new AbortCommandError();
  }

  oraInstance.text = chalk.bold(
    `Downloading files from repo ${chalk.cyan(template)}. This might take a moment.`
  );

  return await downloadAndExtractRepoAsync(repoInfo, {
    cwd: templateDirectory,
    name: appName,
  });
}
