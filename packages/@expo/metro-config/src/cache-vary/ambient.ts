import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { event } from '../events';

export type AmbientVaryScheme = 'env' | 'expo-config';

/** Values that ambient schemes need but that are not part of a dimension's name. */
export interface AmbientVaryContext {
  /** The project root used to evaluate the Expo config for the `expo-config` scheme. */
  projectRoot?: string;
}

export function isAmbientVaryScheme(scheme: string): scheme is AmbientVaryScheme {
  return scheme === 'env' || scheme === 'expo-config';
}

export function readAmbientVaryValue(
  scheme: AmbientVaryScheme,
  name: string,
  context?: AmbientVaryContext
): string | undefined {
  switch (scheme) {
    case 'env':
      return process.env[name];
    case 'expo-config':
      return name === 'exp' && context?.projectRoot
        ? readPublicExpoConfig(context.projectRoot)
        : undefined;
  }
}

interface PublicExpoConfigMemo {
  /** Identifies the config files on disk at the time `value` was evaluated. */
  files: string;
  value: string;
}

const publicExpoConfigByRoot = new Map<string, PublicExpoConfigMemo>();

// NOTE: Keep the `getConfig` options aligned with the `APP_MANIFEST` inlining plugins, which
// derive the inlined manifest from the same public config.
function readPublicExpoConfig(projectRoot: string): string | undefined {
  try {
    const { getConfig, getConfigFilePaths } =
      require('@expo/config') as typeof import('@expo/config');
    // Re-evaluate when a config file is edited, e.g. during `expo start`. Values that the config
    // reads from elsewhere (other files, the environment) only apply once a file changes.
    const { staticConfigPath, dynamicConfigPath } = getConfigFilePaths(projectRoot);
    const files = [staticConfigPath, dynamicConfigPath, path.join(projectRoot, 'package.json')]
      .map(fileStamp)
      .join('\n');
    const memo = publicExpoConfigByRoot.get(projectRoot);
    if (memo?.files === files) {
      return memo.value;
    }
    const { exp } = getConfig(projectRoot, {
      isPublicConfig: true,
      skipSDKVersionRequirement: true,
    });
    const value = JSON.stringify(exp);
    publicExpoConfigByRoot.set(projectRoot, { files, value });
    return value;
  } catch (error) {
    // An unreadable config can't be fingerprinted; callers treat this as a cache miss.
    event('cache:vary_fingerprint_failed', {
      scheme: 'expo-config',
      error: event.error(error as Error),
    });
    return undefined;
  }
}

function fileStamp(filePath: string | null): string {
  if (!filePath) return '';
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  return stat ? `${filePath}:${stat.mtimeMs}:${stat.size}` : `${filePath}:missing`;
}

export type CacheVaryDim = { scheme: string; name: string };

export interface EmbeddedVaryDim extends CacheVaryDim {
  fp: string;
}

export async function currentFingerprint(
  scheme: string,
  name: string,
  context?: AmbientVaryContext
): Promise<string | null> {
  if (!isAmbientVaryScheme(scheme)) return null;
  const value = readAmbientVaryValue(scheme, name, context);
  if (scheme === 'expo-config' && value === undefined) return null;
  return sha1(fingerprintInput(value));
}

export async function embedCurrentFingerprints(
  dims: readonly CacheVaryDim[] | undefined,
  context?: AmbientVaryContext
): Promise<EmbeddedVaryDim[] | undefined> {
  if (!dims?.length) return undefined;
  return await Promise.all(
    dims.map(async (dim) => ({
      ...dim,
      fp: (await currentFingerprint(dim.scheme, dim.name, context))!,
    }))
  );
}

export const dimId = (dim: CacheVaryDim): string => `${dim.scheme}:${dim.name}`;

export function canonicalDimNames(dims: readonly CacheVaryDim[]): string {
  return dims.map(dimId).sort().join('\n');
}

export function canonicalDims(dims: readonly EmbeddedVaryDim[]): string {
  return dims
    .map((d) => `${dimId(d)}=${d.fp}`)
    .sort()
    .join('\n');
}

function sha1(value: string): string {
  return crypto.createHash('sha1').update(value).digest('hex');
}

function fingerprintInput(value: string | undefined): string {
  // JSON framing separates unset from empty.
  return value === undefined ? '' : JSON.stringify(value);
}
