import fetch from 'node-fetch';

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
    if (!response.ok) {
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

// See: https://github.com/expo/expo/blob/a5a6eecb082b2c7a7fc9956141738231c7df473f/packages/%40expo/cli/src/utils/npm.ts#L134-L139
async function extractRemoteGitHubTarballAsync(
  url: string,
  repo: GitHubRepoInfo,
  props: ExtractProps
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Unexpected response: ${response.statusText} (${url})`);
  if (!response.body) throw new Error(`Unexpected response: no response body (${url})`);

  // Extract the (sub)directory into non-empty path segments
  const directory = repo.filePath.replace(/^\//, '').split('/').filter(Boolean);
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

  const url = `https://codeload.github.com/${info.owner}/${info.name}/tar.gz/${info.branch}`;

  debug('Resolved GitHub repository', info);
  debug('Downloading GitHub repository from:', url);

  await extractRemoteGitHubTarballAsync(url, info, props);
}
