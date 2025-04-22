import { ExpoConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';

import { type Options as AndroidRunOptions } from './android/resolveOptions';
import { type Options as IosRunOptions } from './ios/XcodeBuild.types';
import {
  calculateEASFingerprintHashAsync,
  resolveEASRemoteBuildCache,
  uploadEASRemoteBuildCache,
} from '../utils/remote-build-cache-providers/eas';
const debug = require('debug')('expo:run:remote-build') as typeof console.log;

export async function resolveRemoteBuildCache(
  projectRoot: string,
  {
    platform,
    provider,
    runOptions,
  }: {
    platform: ModPlatform;
    provider?: Required<Required<ExpoConfig>['experiments']>['remoteBuildCache']['provider'];
    runOptions: AndroidRunOptions | IosRunOptions;
  }
): Promise<string | null> {
  const fingerprintHash = await calculateFingerprintHashAsync(projectRoot, platform, provider);
  if (!fingerprintHash) {
    return null;
  }

  if (provider === 'eas') {
    return await resolveEASRemoteBuildCache({ platform, fingerprintHash, projectRoot, runOptions });
  }

  return null;
}

export async function uploadRemoteBuildCache(
  projectRoot: string,
  {
    platform,
    provider,
    buildPath,
  }: {
    platform: ModPlatform;
    provider?: Required<Required<ExpoConfig>['experiments']>['remoteBuildCache']['provider'];
    buildPath?: string;
  }
): Promise<void> {
  const fingerprintHash = await calculateFingerprintHashAsync(projectRoot, platform, provider);
  if (!fingerprintHash) {
    return;
  }

  if (provider === 'eas') {
    await uploadEASRemoteBuildCache({
      projectRoot,
      platform,
      fingerprintHash,
      buildPath,
    });
  }
}

async function calculateFingerprintHashAsync(
  projectRoot: string,
  platform: ModPlatform,
  provider?: Required<Required<ExpoConfig>['experiments']>['remoteBuildCache']['provider']
): Promise<string | null> {
  if (provider === 'eas') {
    const easFingerprintHash = await calculateEASFingerprintHashAsync({ projectRoot, platform });
    if (easFingerprintHash) {
      return easFingerprintHash;
    }
  }

  const Fingerprint = importFingerprintForDev(projectRoot);
  if (!Fingerprint) {
    debug('@expo/fingerprint is not installed in the project, skip checking for remote builds');
    return null;
  }
  const fingerprint = await Fingerprint.createFingerprintAsync(projectRoot);

  return fingerprint.hash;
}

function importFingerprintForDev(projectRoot: string): null | typeof import('@expo/fingerprint') {
  try {
    return require(require.resolve('@expo/fingerprint', { paths: [projectRoot] }));
  } catch {
    return null;
  }
}
