import { IOSConfig } from '@expo/config-plugins';
import { JSONValue } from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import { TarTypeFlag } from 'multitars';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import slugify from 'slugify';
import { Readable } from 'stream';

import { CommandError } from './errors';
import { extractStream } from './tar';
import { createCachedFetch } from '../api/rest/client';

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
  const results = await npmViewAsync(packageName, 'dist');

  assert(results, `Could not get npm url for package "${packageName}"`);

  // Fully qualified url returns an object.
  // Example:
  // 𝝠 npm view expo-template-bare-minimum@sdk-33 dist --json
  if (typeof results === 'object' && !Array.isArray(results)) {
    return results.tarball as string;
  }

  // When the tag is arbitrary, the tarball is an array, return the last value as it's the most recent.
  // Example:
  // 𝝠 npm view expo-template-bare-minimum@33 dist --json
  if (Array.isArray(results)) {
    const lastResult = results[results.length - 1];

    if (lastResult && typeof lastResult === 'object' && !Array.isArray(lastResult)) {
      return lastResult.tarball as string;
    }
  }

  throw new CommandError(
    'Expected results of `npm view ...` to be an array or string. Instead found: ' + results
  );
}

export interface ExtractProps {
  expName?: string;
  filter?(path: string): boolean | undefined | null;
  strip?: number;
}

function renameNpmTarballEntries(expName: string | undefined) {
  const renameConfigs = (input: string, typeflag: TarTypeFlag): string | null => {
    if (typeflag === TarTypeFlag.FILE && path.basename(input) === 'gitignore') {
      // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
      // See: https://github.com/npm/npm/issues/1862
      return input.replace(/gitignore$/, '.gitignore');
    } else {
      return input;
    }
  };
  if (expName) {
    const androidName = IOSConfig.XcodeUtils.sanitizedName(expName.toLowerCase());
    const iosName = IOSConfig.XcodeUtils.sanitizedName(expName);
    const lowerCaseName = iosName.toLowerCase();
    return (input: string, typeflag: TarTypeFlag) => {
      input = input
        .replace(/HelloWorld/g, input.includes('android') ? androidName : iosName)
        .replace(/helloworld/g, lowerCaseName);
      return renameConfigs(input, typeflag);
    };
  } else {
    return renameConfigs;
  }
}

/**
 * Extracts a tarball stream to a directory and returns the checksum of the tarball.
 */
export async function extractNpmTarballAsync(
  stream: NodeJS.ReadableStream,
  output: string,
  props: ExtractProps
): Promise<string> {
  return await extractStream(stream, output, {
    filter: props.filter,
    rename: renameNpmTarballEntries(props.expName),
    strip: props.strip ?? 1,
  });
}

export async function extractNpmTarballFromUrlAsync(
  url: string,
  output: string,
  props: ExtractProps
): Promise<string> {
  const response = await cachedFetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Unexpected response: ${response.statusText}. From url: ${url}`);
  }
  return await extractNpmTarballAsync(Readable.fromWeb(response.body), output, props);
}

export async function downloadAndExtractNpmModuleAsync(
  npmName: string,
  output: string,
  props: ExtractProps
): Promise<string> {
  const url = await getNpmUrlAsync(npmName);
  debug('Fetch from URL:', url);
  return await extractNpmTarballFromUrlAsync(url, output, props);
}

export async function extractLocalNpmTarballAsync(
  tarFilePath: string,
  output: string,
  props: ExtractProps
): Promise<string> {
  const readStream = fs.createReadStream(tarFilePath);
  return await extractNpmTarballAsync(readStream, output, props);
}

export async function packNpmTarballAsync(packageDir: string): Promise<string> {
  const cmdArgs = ['pack', '--json', '--foreground-scripts=false'];
  const results = (
    await spawnAsync('npm', cmdArgs, {
      env: { ...process.env },
      cwd: packageDir,
    })
  ).stdout?.trim();
  try {
    const [json] = JSON.parse(results) as { filename: string }[];
    return path.resolve(packageDir, json.filename);
  } catch (error: any) {
    const cmdString = `npm ${cmdArgs.join(' ')}`;
    throw new Error(
      `Could not parse JSON returned from "${cmdString}".\n\n${results}\n\nError: ${error.message}`
    );
  }
}
