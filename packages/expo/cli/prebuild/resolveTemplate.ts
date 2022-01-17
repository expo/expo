import chalk from 'chalk';
import fs from 'fs';
import fetch from 'node-fetch';
import { Ora } from 'ora';
import path from 'path';

import * as Log from '../log';
import { AbortCommandError, CommandError } from '../utils/errors';
import { extractLocalNpmTarballAsync, extractNpmTarballFromUrlAsync } from '../utils/npm';
import { isUrlOk } from '../utils/url';

type RepoInfo = {
  username: string;
  name: string;
  branch: string;
  filePath: string;
};

async function getRepoInfo(url: any, examplePath?: string): Promise<RepoInfo | undefined> {
  const [, username, name, t, _branch, ...file] = url.pathname.split('/');
  const filePath = examplePath ? examplePath.replace(/^\//, '') : file.join('/');

  // Support repos whose entire purpose is to be an example, e.g.
  // https://github.com/:username/:my-cool-example-repo-name.
  if (t === undefined) {
    const infoResponse = await fetch(`https://api.github.com/repos/${username}/${name}`);
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
  root: string,
  { username, name, branch, filePath }: RepoInfo
): Promise<void> {
  const projectName = path.basename(root);

  const strip = filePath ? filePath.split('/').length + 1 : 1;

  const url = `https://codeload.github.com/${username}/${name}/tar.gz/${branch}`;
  Log.debug('Downloading tarball from:', url);
  await extractNpmTarballFromUrlAsync(url, {
    cwd: root,
    name: projectName,
    strip,
    fileList: [`${name}-${branch}${filePath ? `/${filePath}` : ''}`],
  });
}

export async function resolveTemplateArgAsync(
  tempDir: string,
  oraInstance: Ora,
  appName: string,
  template: string,
  templatePath?: string
) {
  let repoInfo: RepoInfo | undefined;

  if (template) {
    // @ts-ignore
    let repoUrl: URL | undefined;

    try {
      // @ts-ignore
      repoUrl = new URL(template);
    } catch (error: any) {
      if (error.code !== 'ERR_INVALID_URL') {
        oraInstance.fail(error);
        throw error;
      }
    }

    if (!repoUrl) {
      const templatePath = path.resolve(template);
      if (!fs.existsSync(templatePath)) {
        throw new CommandError(`template file does not exist: ${templatePath}`);
      }

      await extractLocalNpmTarballAsync(templatePath, { cwd: tempDir, name: appName });
      return tempDir;
    }

    if (repoUrl.origin !== 'https://github.com') {
      oraInstance.fail(
        `Invalid URL: ${chalk.red(
          `"${template}"`
        )}. Only GitHub repositories are supported. Please use a GitHub URL and try again.`
      );
      throw new AbortCommandError();
    }

    repoInfo = await getRepoInfo(repoUrl, templatePath);

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
  }

  if (repoInfo) {
    oraInstance.text = chalk.bold(
      `Downloading files from repo ${chalk.cyan(template)}. This might take a moment.`
    );

    await downloadAndExtractRepoAsync(tempDir, repoInfo);
  }

  return true;
}
