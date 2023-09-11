import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import prompts from 'prompts';
import { Stream } from 'stream';
import tar from 'tar';
import { promisify } from 'util';

import { sanitizeTemplateAsync } from './Template';
import { createEntryResolver, createFileTransform } from './createFileTransform';
import { env } from './utils/env';

const debug = require('debug')('expo:init:template') as typeof console.log;
const pipeline = promisify(Stream.pipeline);

/**
 * The partial GitHub content type, used to filter out examples.
 * @see https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28
 */
export type GithubContent = {
  name: string;
  path: string;
  type: 'file' | 'dir';
};

/** List all existing examples directory from https://github.com/expo/examples. */
async function listExamplesAsync() {
  const response = await fetch('https://api.github.com/repos/expo/examples/contents');
  if (!response.ok) {
    throw new Error('Unexpected GitHub API response: https://github.com/expo/examples');
  }

  const data: GithubContent[] = await response.json();
  return data.filter(item => item.type === 'dir' && !item.name.startsWith('.'));
}

/** Determine if an example exists, using only its name */
async function hasExampleAsync(name: string) {
  const response = await fetch(
    `https://api.github.com/repos/expo/examples/contents/${encodeURIComponent(name)}/package.json`
  );

  // Either ok or 404 responses are expected
  if (response.status === 404 || response.ok) {
    return response.ok;
  }

  throw new Error(`Unexpected GitHub API response: ${response.status} - ${response.statusText}`);
}

export async function ensureExampleExists(name: string) {
  if (!(await hasExampleAsync(name))) {
    throw new Error(`Example "${name}" does not exist, see https://github.com/expo/examples`);
  }
}

/** Ask the user which example to create */
export async function promptExamplesAsync() {
  if (env.CI) {
    throw new Error('Cannot prompt for examples in CI');
  }

  const examples = await listExamplesAsync();
  const { answer } = await prompts({
    type: 'select',
    name: 'answer',
    message: 'Choose an example:',
    choices: examples.map(example => ({
      title: example.name,
      value: example.path,
    })),
  });

  if (!answer) {
    console.log();
    console.log(chalk`Please specify the example, example: {cyan --example with-router}`);
    console.log();
    process.exit(1);
  }

  return answer;
}

/** Download and move the selected example from https://github.com/expo/examples. */
export async function downloadAndExtractExampleAsync(root: string, name: string) {
  const projectName = path.basename(root);
  const response = await fetch('https://codeload.github.com/expo/examples/tar.gz/master');
  if (!response.ok) {
    debug(`Failed to fetch the examples code, received status "${response.status}"`);
    throw new Error('Failed to fetch the examples code from https://github.com/expo/examples');
  }

  await pipeline(
    response.body,
    tar.extract(
      {
        cwd: root,
        transform: createFileTransform(projectName),
        onentry: createEntryResolver(projectName),
        strip: 2,
      },
      [`examples-master/${name}`]
    )
  );

  await sanitizeTemplateAsync(root);
  await sanitizeScriptsAsync(root);
}

function exampleHasNativeCode(root: string): boolean {
  return [path.join(root, 'android'), path.join(root, 'ios')].some(folder => fs.existsSync(folder));
}

export async function sanitizeScriptsAsync(root: string) {
  const defaultScripts = exampleHasNativeCode(root)
    ? {
        start: 'expo start --dev-client',
        android: 'expo run:android',
        ios: 'expo run:ios',
        web: 'expo start --web',
      }
    : {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
      };

  const packageFile = new JsonFile(path.join(root, 'package.json'));
  const packageJson = await packageFile.readAsync();

  const scripts = (packageJson.scripts ?? {}) as Record<string, string>;
  packageJson.scripts = { ...defaultScripts, ...scripts };

  await packageFile.writeAsync(packageJson);
}
