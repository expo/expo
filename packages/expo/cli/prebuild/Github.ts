import chalk from 'chalk';
import * as fs from 'fs-extra';
import got from 'got';
import { Ora } from 'ora';
import path from 'path';
import { Stream } from 'stream';
import tar from 'tar';
import { promisify } from 'util';

import { CommandError, AbortCommandError } from '../utils/errors';
import {
  createEntryResolver,
  createFileTransform,
  extractTemplateAppFolderAsync,
} from '../utils/extractTemplateAppAsync';

// @ts-ignore
const pipeline = promisify(Stream.pipeline);

type RepoInfo = {
  username: string;
  name: string;
  branch: string;
  filePath: string;
};

async function isUrlOk(url: string): Promise<boolean> {
  const res = await got(url).catch((e) => e);
  return res.statusCode === 200;
}

async function getRepoInfo(url: any, examplePath?: string): Promise<RepoInfo | undefined> {
  const [, username, name, t, _branch, ...file] = url.pathname.split('/');
  const filePath = examplePath ? examplePath.replace(/^\//, '') : file.join('/');

  // Support repos whose entire purpose is to be an example, e.g.
  // https://github.com/:username/:my-cool-example-repo-name.
  if (t === undefined) {
    const infoResponse = await got(`https://api.github.com/repos/${username}/${name}`).catch(
      (e) => e
    );
    if (infoResponse.statusCode !== 200) {
      return;
    }
    const info = JSON.parse(infoResponse.body);
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
    } catch (error) {
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

      return await extractTemplateAppFolderAsync(templatePath, tempDir, { name: appName });
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

function downloadAndExtractRepoAsync(
  root: string,
  { username, name, branch, filePath }: RepoInfo
): Promise<void> {
  const projectName = path.basename(root);

  const strip = filePath ? filePath.split('/').length + 1 : 1;
  return pipeline(
    got.stream(`https://codeload.github.com/${username}/${name}/tar.gz/${branch}`),
    tar.extract(
      {
        cwd: root,
        transform: createFileTransform({ name: projectName }),
        onentry: createEntryResolver(projectName),
        strip,
      },
      [`${name}-${branch}${filePath ? `/${filePath}` : ''}`]
    )
  );
}
