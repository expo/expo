import { getExpoHomeDirectory } from '@expo/config/build/getUserState';
import path from 'path';
import ProgressBar from 'progress';
import { gt } from 'semver';

import { downloadAppAsync } from './downloadAppAsync';
import { CommandError } from './errors';
import { ora } from './ora';
import { profile } from './profile';
import { createProgressBar } from './progress';
import { getVersionsAsync, SDKVersion } from '../api/getVersions';
import { Log } from '../log';

const debug = require('debug')('expo:utils:downloadExpoGo') as typeof console.log;

const platformSettings: Record<
  string,
  {
    shouldExtractResults: boolean;
    versionsKey: keyof SDKVersion;
    getFilePath: (filename: string) => string;
  }
> = {
  ios: {
    versionsKey: 'iosClientUrl',
    getFilePath: (filename) =>
      path.join(getExpoHomeDirectory(), 'ios-simulator-app-cache', `${filename}.app`),
    shouldExtractResults: true,
  },
  android: {
    versionsKey: 'androidClientUrl',
    getFilePath: (filename) =>
      path.join(getExpoHomeDirectory(), 'android-apk-cache', `${filename}.apk`),
    shouldExtractResults: false,
  },
};

/**
 * @internal exposed for testing.
 * @returns the matching `SDKVersion` object from the Expo API.
 */
export async function getExpoGoVersionEntryAsync(sdkVersion: string): Promise<SDKVersion> {
  const { sdkVersions: versions } = await getVersionsAsync();
  let version: SDKVersion;

  if (sdkVersion.toUpperCase() === 'UNVERSIONED') {
    // find the latest version
    const latestVersionKey = Object.keys(versions).reduce((a, b) => {
      if (gt(b, a)) {
        return b;
      }
      return a;
    }, '0.0.0');

    Log.warn(
      `Downloading the latest Expo Go client (${latestVersionKey}). This will not fully conform to UNVERSIONED.`
    );
    version = versions[latestVersionKey];
  } else {
    version = versions[sdkVersion];
  }

  if (!version) {
    throw new CommandError(`Unable to find a version of Expo Go for SDK ${sdkVersion}`);
  }
  return version;
}

/** Download the Expo Go app from the Expo servers (if only it was this easy for every app). */
export async function downloadExpoGoAsync(
  platform: keyof typeof platformSettings,
  {
    url,
    sdkVersion,
  }: {
    url?: string;
    sdkVersion: string;
  }
): Promise<string> {
  const { getFilePath, versionsKey, shouldExtractResults } = platformSettings[platform];

  const spinner = ora({ text: 'Fetching Expo Go', color: 'white' }).start();

  let bar: ProgressBar | null = null;

  try {
    if (!url) {
      const version = await getExpoGoVersionEntryAsync(sdkVersion);

      debug(`Installing Expo Go version for SDK ${sdkVersion} at URL: ${version[versionsKey]}`);
      url = version[versionsKey] as string;
    }
  } catch (error) {
    spinner.fail();
    throw error;
  }

  const filename = path.parse(url).name;

  try {
    const outputPath = getFilePath(filename);
    debug(`Downloading Expo Go from "${url}" to "${outputPath}".`);
    debug(
      `The requested copy of Expo Go might already be cached in: "${getExpoHomeDirectory()}". You can disable the cache with EXPO_NO_CACHE=1`
    );
    await profile(downloadAppAsync)({
      url,
      // Save all encrypted cache data to `~/.expo/expo-go`
      cacheDirectory: 'expo-go',
      outputPath,
      extract: shouldExtractResults,
      onProgress({ progress, total }) {
        if (progress && total) {
          if (!bar) {
            if (spinner.isSpinning) {
              spinner.stop();
            }
            bar = createProgressBar('Downloading the Expo Go app [:bar] :percent :etas', {
              width: 64,
              total: 100,
              // clear: true,
              complete: '=',
              incomplete: ' ',
            });
          } else {
            bar!.update(progress, total);
          }
        }
      },
    });
    return outputPath;
  } finally {
    spinner.stop();
    // @ts-expect-error
    bar?.terminate();
  }
}
