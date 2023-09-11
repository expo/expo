import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Stream } from 'stream';
import tar from 'tar';
import { promisify } from 'util';

import { createEntryResolver, createFileTransform } from '../createFileTransform';
import { ALIASES } from '../legacyTemplates';
import { Log } from '../log';
import { env } from './env';

const debug = require('debug')('expo:init:npm') as typeof console.log;

type ExtractProps = {
  name: string;
  cwd: string;
  strip?: number;
  fileList?: string[];
  disableCache?: boolean;
};

// @ts-ignore
const pipeline = promisify(Stream.pipeline);

function getTemporaryCacheFilePath(subdir: string = 'template-cache') {
  // This is cleared when the device restarts
  return path.join(os.tmpdir(), '.create-expo-app', subdir);
}

/** Applies the `@beta` npm tag when `EXPO_BETA` is enabled. */
export function applyBetaTag(npmPackageName: string): string {
  let [name, tag] = splitNpmNameAndTag(npmPackageName);

  if (!tag && env.EXPO_BETA) {
    debug('Using beta tag for', name);
    tag = 'beta';
  }

  return joinNpmNameAndTag(name, tag);
}

/** Join an NPM package name and tag together, stripping the tag if it's `undefined`. */
function joinNpmNameAndTag(name: string, tag: string | undefined): string {
  return [name, tag].filter(Boolean).join('@');
}

/** Split a package name from its tag. */
export function splitNpmNameAndTag(npmPackageName: string): [string, string | undefined] {
  const components = npmPackageName.split('@').filter(Boolean);

  if (npmPackageName.startsWith('@')) {
    return ['@' + components[0], components[1]];
  }

  return [components[0], components[1]];
}

/**
 * Applies known shortcuts to an NPM package name and tag.
 * - If the name is `blank`, `blank-typescript`, `tabs`, or `bare-minimum`, apply the prefix `expo-template-`.
 * - If a tag is a numeric value like `45`, and the name is a known template, then convert the tag to `sdk-X`.
 *
 * @example `blank@45` => `expo-template-blank@sdk-45`
 */
export function getResolvedTemplateName(npmPackageName: string) {
  let [name, tag = 'latest'] = splitNpmNameAndTag(npmPackageName);

  if (name.startsWith('@')) {
    return joinNpmNameAndTag(name, tag);
  }

  const aliasPrefix = 'expo-template-';

  if (ALIASES.includes(aliasPrefix + name)) {
    name = aliasPrefix + name;
  }

  // Only apply the numeric conversion if the name is a known template.
  if (ALIASES.includes(name)) {
    if (tag?.match(/^\d+$/)) {
      return name + '@sdk-' + tag;
    }
  }

  return joinNpmNameAndTag(name, tag);
}

export function applyKnownNpmPackageNameRules(name: string): string | null {
  // https://github.com/npm/validate-npm-package-name/#naming-rules

  // package name cannot start with '.' or '_'.
  while (/^(\.|_)/.test(name)) {
    name = name.substring(1);
  }

  name = name.toLowerCase().replace(/[^a-zA-Z0-9._\-/@]/g, '');

  return (
    name
      // .replace(/![a-z0-9-._~]+/g, '')
      // Remove special characters
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') || null
  );
}

export async function extractLocalNpmTarballAsync(
  tarFilePath: string,
  props: ExtractProps
): Promise<void> {
  const readStream = fs.createReadStream(tarFilePath);
  await extractNpmTarballAsync(readStream, props);
}

export async function extractNpmTarballAsync(
  stream: NodeJS.ReadableStream | null,
  props: ExtractProps
): Promise<void> {
  if (!stream) {
    throw new Error('Missing stream');
  }
  const { cwd, strip, name, fileList = [] } = props;

  await fs.promises.mkdir(cwd, { recursive: true });

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

async function npmPackAsync(
  packageName: string,
  cwd: string | undefined = undefined,
  ...props: string[]
): Promise<NpmPackageInfo[] | null> {
  const npm = getNpmBin();

  const cmd = ['pack', packageName, ...props];

  const cmdString = `${npm} ${cmd.join(' ')}`;
  debug('Run:', cmdString, `(cwd: ${cwd ?? process.cwd()})`);

  if (cwd) {
    await fs.promises.mkdir(cwd, { recursive: true });
  }

  let results: string;
  try {
    results = (await spawnAsync(npm, [...cmd, '--json'], { cwd })).stdout?.trim();
  } catch (error: any) {
    if (error?.stderr.match(/npm ERR! code E404/)) {
      const pkg =
        error.stderr.match(/npm ERR! 404\s+'(.*)' is not in this registry\./)?.[1] ?? error.stderr;
      throw new Error(`NPM package not found: ` + pkg);
    }
    throw error;
  }

  if (!results) {
    return null;
  }

  try {
    const json = JSON.parse(results);
    if (Array.isArray(json) && json.every(isNpmPackageInfo)) {
      return json.map(sanitizeNpmPackageFilename);
    } else {
      throw new Error(`Invalid response from npm: ${results}`);
    }
  } catch (error: any) {
    throw new Error(
      `Could not parse JSON returned from "${cmdString}".\n\n${results}\n\nError: ${error.message}`
    );
  }
}

export type NpmPackageInfo = {
  /** "expo-template-blank@45.0.0" */
  id: string;
  /** "expo-template-blank" */
  name: string;
  /** "45.0.0" */
  version: string;
  /** 73765 */
  size: number;
  /** 90909 */
  unpackedSize: number;
  /** "2366988b44e4ee16eb2b0e902ee6c12a127b2c2e" */
  shasum: string;
  /** "sha512-oc7MjAt3sp8mi3Gf3LkKUNUkbiK7lJ7BecHMqe06n8vrStT4h2cHJKxf5dtAfgmXkBHHsQE/g7RUWrh1KbBjAw==" */
  integrity: string;
  /** "expo-template-blank-45.0.0.tgz" */
  filename: string;
  files: {
    path: string;
    size: number;
    mode: number;
  }[];
  entryCount: number;
  bundled: unknown[];
};

function getNpmBin() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function getNpmInfoAsync(moduleId: string, cwd: string): Promise<NpmPackageInfo> {
  const infos = await npmPackAsync(moduleId, cwd, '--dry-run');
  if (infos?.[0]) {
    return infos[0];
  }
  throw new Error(`Could not find npm package "${moduleId}"`);
}

function isNpmPackageInfo(item: any): item is NpmPackageInfo {
  return (
    item &&
    typeof item === 'object' &&
    'id' in item &&
    'filename' in item &&
    'version' in item &&
    'files' in item
  );
}

/**
 * Adjust the tar filename in npm package info for `npm@<9.0.0`.
 *
 * @see https://github.com/npm/cli/issues/3405
 */
function sanitizeNpmPackageFilename(item: NpmPackageInfo): NpmPackageInfo {
  if (item.filename.startsWith('@') && item.name.startsWith('@')) {
    item.filename = item.filename.replace(/^@/, '').replace(/\//, '-');
  }

  return item;
}

async function fileExistsAsync(path: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(path);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function downloadAndExtractNpmModuleAsync(
  npmName: string,
  props: ExtractProps
): Promise<void> {
  const cachePath = getTemporaryCacheFilePath();

  debug(`Looking for NPM tarball (id: ${npmName}, cache: ${cachePath})`);

  await fs.promises.mkdir(cachePath, { recursive: true });

  const info = await getNpmInfoAsync(npmName, cachePath);

  const cacheFilename = path.join(cachePath, info.filename);
  try {
    // TODO: This cache does not expire.
    const fileExists = await fileExistsAsync(cacheFilename);

    const disableCache = env.EXPO_NO_CACHE || props.disableCache;
    if (disableCache || !fileExists) {
      debug(`Downloading tarball for ${npmName} to ${cachePath}...`);
      await npmPackAsync(npmName, cachePath);
    }
  } catch (error: any) {
    Log.error('Error downloading template package: ' + npmName);
    throw error;
  }

  try {
    await extractLocalNpmTarballAsync(cacheFilename, {
      cwd: props.cwd,
      name: props.name,
    });
  } catch (error: any) {
    Log.error('Error extracting template package: ' + npmName);
    throw error;
  }
}
