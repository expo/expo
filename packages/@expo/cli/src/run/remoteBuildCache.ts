import { ExpoConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import path from 'path';

import { Log } from '../log';

const debug = require('debug')('expo:run:remote-build') as typeof console.log;

export async function resolveRemoteBuildCache(
  projectRoot: string,
  {
    platform,
    provider,
  }: {
    platform: ModPlatform;
    provider?: Required<Required<ExpoConfig>['experiments']>['remoteBuildCache']['provider'];
  }
): Promise<string | null> {
  const Fingerprint = importFingerprintForDev(projectRoot);
  if (!Fingerprint) {
    debug('@expo/fingerprint is not installed in the project, skip checking for remote builds');
    return null;
  }
  const fingerprint = await Fingerprint.createFingerprintAsync(projectRoot);

  if (provider === 'eas') {
    const easJsonPath = path.join(projectRoot, 'eas.json');
    if (!fs.existsSync(easJsonPath)) {
      debug('eas.json not found, skip checking for remote builds');
      return null;
    }

    Log.log(`Searching builds with matching fingerprint on EAS servers`);
    try {
      const results = await spawnAsync(
        'npx',
        [
          'eas-cli',
          'build:download',
          `--platform=${platform}`,
          `--fingerprint=${fingerprint.hash}`,
          '--non-interactive',
          '--dev-client',
          '--json',
        ],
        {
          cwd: projectRoot,
        }
      );

      Log.log(`Successfully downloaded cached build`);
      // {
      //   "path": "/var/folders/03/lppcpcnn61q3mz5ckzmzd8w80000gn/T/eas-cli-nodejs/eas-build-run-cache/c0f9ba9c-0cf1-4c5c-8566-b28b7971050f_22f1bbfa-1c09-4b67-9e4a-721906546b58.app"
      // }
      const json = JSON.parse(results.stdout.trim());
      return json?.path;
    } catch (error) {
      debug('eas-cli error:', error);
      return null;
    }
  }

  return null;
}

export async function uploadRemoteBuildCache(
  projectRoot: string,
  {
    platform,
    provider,
  }: {
    platform: ModPlatform;
    provider?: Required<Required<ExpoConfig>['experiments']>['remoteBuildCache']['provider'];
  }
): Promise<string | null> {
  const Fingerprint = importFingerprintForDev(projectRoot);
  if (!Fingerprint) {
    debug('@expo/fingerprint is not installed in the project, skip checking for remote builds');
    return null;
  }
  const fingerprint = await Fingerprint.createFingerprintAsync(projectRoot);

  if (provider === 'eas') {
    const easJsonPath = path.join(projectRoot, 'eas.json');
    if (!fs.existsSync(easJsonPath)) {
      debug('eas.json not found, skip checking for remote builds');
      return null;
    }

    try {
      Log.log('Uploading build to remote cache');
      const results = await spawnAsync(
        'npx',
        [
          'eas-cli',
          'upload',
          `--platform=${platform}`,
          `--fingerprint=${fingerprint.hash}`,
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
      Log.log(`Build successfully uploaded: ${json?.url}`);
    } catch (error) {
      debug('eas-cli error:', error);
      return null;
    }
  }

  return null;
}

function importFingerprintForDev(projectRoot: string): null | typeof import('@expo/fingerprint') {
  try {
    return require(require.resolve('@expo/fingerprint', { paths: [projectRoot] }));
  } catch {
    return null;
  }
}
