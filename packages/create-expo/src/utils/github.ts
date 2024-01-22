import fs from 'fs';
import fetch from 'node-fetch';
import os from 'os';
import path from 'path';

import { extractNpmTarballAsync, type ExtractProps } from './npm';
import { createGlobFilter } from '../createFileTransform';

const debug = require('debug')('expo:init:github') as typeof console.log;

type GitHubRepoInfo = {
  owner: string;
  name: string;
  branch: string;
  filePath: string;
};

// See: https://github.com/expo/expo/blob/a5a6eecb082b2c7a7fc9956141738231c7df473f/packages/%40expo/cli/src/prebuild/resolveTemplate.ts#L60-L84
async function getGitHubRepoAsync(url: URL): Promise<GitHubRepoInfo | undefined> {
  const [, owner, name, t, branch, ...file] = url.pathname.split('/');
  const filePath = file.join('/');

  // Support repos whose entire purpose is to be an example, e.g.
  // https://github.com/:owner/:my-cool-example-repo-name.
  if (t === undefined) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}`);
    if (response.status !== 200) {
      return;
    }
    const info = await response.json();
    return { owner, name, branch: info['default_branch'], filePath };
  }

  if (owner && name && branch && t === 'tree') {
    return { owner, name, branch, filePath };
  }

  return undefined;
}

// See: https://github.com/expo/expo/blob/a5a6eecb082b2c7a7fc9956141738231c7df473f/packages/%40expo/cli/src/prebuild/resolveTemplate.ts#L86-L91
async function isValidGitHubRepoAsync({
  owner,
  name,
  branch,
  filePath,
}: GitHubRepoInfo): Promise<boolean> {
  const contentsUrl = `https://api.github.com/repos/${owner}/${name}/contents`;
  const packagePath = `${filePath ? `/${filePath}` : ''}/package.json`;

  const response = await fetch(contentsUrl + packagePath + `?ref=${branch}`);
  return response.ok;
}

function getTemporaryCacheFilePath(info: GitHubRepoInfo) {
  // This is cleared when the device restarts
  return path.join(
    os.tmpdir(),
    '.create-expo-app',
    'github-template-cache',
    info.owner,
    info.name,
    info.branch || ''
  );
}

// See: https://github.com/expo/expo/blob/a5a6eecb082b2c7a7fc9956141738231c7df473f/packages/%40expo/cli/src/utils/npm.ts#L134-L139
async function extractRemoteGitHubTarballAsync(
  url: string,
  repo: GitHubRepoInfo,
  props: ExtractProps
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Unexpected response: ${response.statusText} (${url})`);
  if (!response.body) throw new Error(`Unexpected response: no response body (${url})`);

  const directory = repo.filePath.replace(/^\//, '');
  // Remove the (sub)directory paths, and the root folder added by GitHub
  const strip = directory.split('/').filter(Boolean).length + 1;
  // Only extract the (sub)directory paths
  const filter = strip > 1 ? createGlobFilter(`*/${directory}/**`) : undefined;

  await extractNpmTarballAsync(response.body, { ...props, filter, strip });
}

export async function downloadAndExtractGitHubRepositoryAsync(
  repoUrl: URL,
  props: ExtractProps
): Promise<void> {
  debug('Looking for GitHub repository');

  const info = await getGitHubRepoAsync(repoUrl);
  if (!info) {
    throw new Error(`Invalid URL: "${repoUrl}". Only GitHub repositories are supported.`);
  }

  const isValid = await isValidGitHubRepoAsync(info);
  if (!isValid) {
    throw new Error(
      `Could not to locate repository for "${repoUrl}", ensure this repository exists`
    );
  }

  debug('Resolved GitHub repository', info);

  const url = `https://codeload.github.com/${info.owner}/${info.name}/tar.gz/${info.branch}`;
  const cachePath = getTemporaryCacheFilePath(info);

  debug('Downloading GitHub repository from:', url);

  await fs.promises.mkdir(cachePath, { recursive: true });
  await extractRemoteGitHubTarballAsync(url, info, props);
}
