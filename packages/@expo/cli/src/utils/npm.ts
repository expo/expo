import { JSONValue } from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import assert from 'assert';
import fs from 'fs';
import slugify from 'slugify';
import { Stream } from 'stream';
import tar from 'tar';
import { promisify } from 'util';

import { createCachedFetch } from '../api/rest/client';
import { createEntryResolver, createFileTransform } from './createFileTransform';
import { ensureDirectoryAsync } from './dir';
import { CommandError } from './errors';

const debug = require('debug')('expo:utils:npm') as typeof console.log;

const cachedFetch = createCachedFetch({
  cacheDirectory: 'template-cache',
  // Time to live. How long (in ms) responses remain cached before being automatically ejected. If undefined, responses are never automatically ejected from the cache.
  // ttl: 1000,
});

export function sanitizeNpmPackageName(name: string): string {
  // https://github.com/npm/validate-npm-package-name/#naming-rules
  return (
    applyKnownNpmPackageNameRules(name) ||
    applyKnownNpmPackageNameRules(slugify(name)) ||
    // If nothing is left use 'app' like we do in Xcode projects.
    'app'
  );
}

function applyKnownNpmPackageNameRules(name: string): string | null {
  // https://github.com/npm/validate-npm-package-name/#naming-rules

  // package name cannot start with '.' or '_'.
  while (/^(\.|_)/.test(name)) {
    name = name.substring(1);
  }

  name = name.toLowerCase().replace(/[^a-zA-Z._\-/@]/g, '');

  return (
    name
      // .replace(/![a-z0-9-._~]+/g, '')
      // Remove special characters
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') || null
  );
}

export async function npmViewAsync(...props: string[]): Promise<JSONValue> {
  const cmd = ['view', ...props, '--json'];
  const results = (await spawnAsync('npm', cmd)).stdout?.trim();
  const cmdString = `npm ${cmd.join(' ')}`;
  debug('Run:', cmdString);
  if (!results) {
    return null;
  }
  try {
    return JSON.parse(results);
  } catch (error: any) {
    throw new Error(
      `Could not parse JSON returned from "${cmdString}".\n\n${results}\n\nError: ${error.message}`
    );
  }
}

/** Given a package name like `expo` or `expo@beta`, return the registry URL if it exists. */
export async function getNpmUrlAsync(packageName: string): Promise<string> {
  const results = await npmViewAsync(packageName, 'dist.tarball');

  assert(results, `Could not get npm url for package "${packageName}"`);

  // Fully qualified url returns a string.
  // Example:
  // 𝝠 npm view expo-template-bare-minimum@sdk-33 dist.tarball --json
  if (typeof results === 'string') {
    return results;
  }

  // When the tag is arbitrary, the tarball url is an array, return the last value as it's the most recent.
  // Example:
  // 𝝠 npm view expo-template-bare-minimum@33 dist.tarball --json
  if (Array.isArray(results)) {
    return results[results.length - 1] as string;
  }

  throw new CommandError(
    'Expected results of `npm view ...` to be an array or string. Instead found: ' + results
  );
}

// @ts-ignore
const pipeline = promisify(Stream.pipeline);

export async function downloadAndExtractNpmModuleAsync(
  npmName: string,
  props: ExtractProps
): Promise<void> {
  const url = await getNpmUrlAsync(npmName);

  debug('Fetch from URL:', url);
  await extractNpmTarballFromUrlAsync(url, props);
}

export async function extractLocalNpmTarballAsync(
  tarFilePath: string,
  props: ExtractProps
): Promise<void> {
  const readStream = fs.createReadStream(tarFilePath);
  await extractNpmTarballAsync(readStream, props);
}

type ExtractProps = {
  name: string;
  cwd: string;
  strip?: number;
  fileList?: string[];
};

async function createUrlStreamAsync(url: string) {
  const response = await cachedFetch(url);
  if (!response.ok) {
    throw new Error(`Unexpected response: ${response.statusText}. From url: ${url}`);
  }

  return response.body;
}

export async function extractNpmTarballFromUrlAsync(
  url: string,
  props: ExtractProps
): Promise<void> {
  await extractNpmTarballAsync(await createUrlStreamAsync(url), props);
}

export async function extractNpmTarballAsync(
  stream: NodeJS.ReadableStream,
  props: ExtractProps
): Promise<void> {
  const { cwd, strip, name, fileList = [] } = props;

  await ensureDirectoryAsync(cwd);

  await pipeline(
    stream,
    tar.extract(
      {
        cwd,
        transform: createFileTransform(name),
        onentry: createEntryResolver(name),
        strip: strip ?? 1,
      },
      fileList
    )
  );
}
