import { ModPlatform } from '@expo/config-plugins';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { isDevClientBuild } from './helpers';
import { CalculateFingerprintHashProps, RemoteBuildCachePlugin, RunOptions } from './types';
import { Log } from '../../log';
import { isSpawnResultError } from '../../start/platforms/ios/xcrun';

const debug = require('debug')('expo:eas-remote-build-cache') as typeof console.log;

export async function resolveEASRemoteBuildCache({
  projectRoot,
  platform,
  fingerprintHash,
  runOptions,
}: {
  projectRoot: string;
  platform: ModPlatform;
  fingerprintHash: string;
  runOptions: RunOptions;
}): Promise<string | null> {
  const easJsonPath = path.join(projectRoot, 'eas.json');
  if (!fs.existsSync(easJsonPath)) {
    debug('eas.json not found, skip checking for remote builds');
    return null;
  }

  Log.log(
    chalk`{whiteBright \u203A} {bold Searching builds with matching fingerprint on EAS servers}`
  );
  try {
    const results = await spawnAsync(
      'npx',
      [
        'eas-cli',
        'build:download',
        `--platform=${platform}`,
        `--fingerprint=${fingerprintHash}`,
        '--non-interactive',
        isDevClientBuild({ runOptions, projectRoot }) ? '--dev-client' : '--no-dev-client',
        '--json',
      ],
      {
        cwd: projectRoot,
      }
    );

    Log.log(chalk`{whiteBright \u203A} {bold Successfully downloaded cached build}`);
    // {
    //   "path": "/var/folders/03/lppcpcnn61q3mz5ckzmzd8w80000gn/T/eas-cli-nodejs/eas-build-run-cache/c0f9ba9c-0cf1-4c5c-8566-b28b7971050f_22f1bbfa-1c09-4b67-9e4a-721906546b58.app"
    // }
    const json = JSON.parse(results.stdout.trim());
    return json?.path;
  } catch (error) {
    debug('eas-cli error:', error);
    // @TODO(2025-04-11): remove this in a future release
    if (isSpawnResultError(error) && error.stderr.includes('command build:download not found')) {
      Log.warn(
        `To take advantage of remote build cache, upgrade your eas-cli installation to latest.`
      );
    }
    return null;
  }
}

export async function uploadEASRemoteBuildCache({
  projectRoot,
  platform,
  fingerprintHash,
  buildPath,
}: {
  projectRoot: string;
  runOptions: RunOptions;
  platform: ModPlatform;
  fingerprintHash: string;
  buildPath?: string;
}) {
  const easJsonPath = path.join(projectRoot, 'eas.json');
  if (!fs.existsSync(easJsonPath)) {
    debug('eas.json not found, skip uploading builds');
    return null;
  }

  try {
    Log.log(chalk`{whiteBright \u203A} {bold Uploading build to remote cache}`);
    const results = await spawnAsync(
      'npx',
      [
        'eas-cli',
        'upload',
        `--platform=${platform}`,
        `--fingerprint=${fingerprintHash}`,
        buildPath ? `--build-path=${buildPath}` : '',
        '--non-interactive',
        '--json',
      ],
      {
        cwd: projectRoot,
      }
    );
    // {
    //   "url": "/var/folders/03/lppcpcnn61q3mz5ckzmzd8w80000gn/T/eas-cli-nodejs/eas-build-run-cache/c0f9ba9c-0cf1-4c5c-8566-b28b7971050f_22f1bbfa-1c09-4b67-9e4a-721906546b58.app"
    // }
    const json = JSON.parse(results.stdout.trim());
    Log.log(chalk`{whiteBright \u203A} {bold Build successfully uploaded: ${json?.url}}`);
    return json?.url;
  } catch (error) {
    debug('eas-cli error:', error);
  }
  return null;
}

export async function calculateEASFingerprintHashAsync({
  projectRoot,
  platform,
}: CalculateFingerprintHashProps): Promise<string | null> {
  // prefer using `eas fingerprint:generate` because it automatically upload sources
  try {
    const results = await spawnAsync(
      'npx',
      ['eas-cli', 'fingerprint:generate', `--platform=${platform}`, '--json', '--non-interactive'],
      {
        cwd: projectRoot,
      }
    );
    // {
    //   "hash": "203f960b965e154b77dc31c6c42e5582e8d77196"
    // }
    const json = JSON.parse(results.stdout.trim());
    return json?.hash;
  } catch (error) {
    debug('eas-cli error:', error);
  }
  return null;
}

export const EASRemoteBuildCacheProvider: RemoteBuildCachePlugin = {
  resolveRemoteBuildCache: resolveEASRemoteBuildCache,
  uploadRemoteBuildCache: uploadEASRemoteBuildCache,
  calculateFingerprintHash: calculateEASFingerprintHashAsync,
};
