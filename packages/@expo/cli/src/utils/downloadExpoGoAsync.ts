import { getExpoHomeDirectory } from '@expo/config/build/getUserState';
import path from 'path';
import ProgressBar from 'progress';

import { getReleasedVersionsAsync, SDKVersion } from '../api/getVersions';
import * as Log from '../log';
import { downloadAppAsync } from './downloadAppAsync';
import { CommandError } from './errors';
import { profile } from './profile';
import { setProgressBar } from './progress';

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

/** Download the Expo Go app from the Expo servers (if only it was this easy for every app). */
export async function downloadExpoGoAsync(
  platform: keyof typeof platformSettings,
  {
    url,
    sdkVersion,
  }: {
    url?: string;
    sdkVersion?: string;
  }
): Promise<string> {
  const { getFilePath, versionsKey, shouldExtractResults } = platformSettings[platform];

  const bar = new ProgressBar('Downloading the Expo Go app [:bar] :percent :etas', {
    width: 64,
    total: 100,
    clear: true,
    complete: '=',
    incomplete: ' ',
  });
  // TODO: Auto track progress
  setProgressBar(bar);

  if (!url) {
    if (!sdkVersion) {
      throw new CommandError(
        `Unable to determine which Expo Go version to install (platform: ${platform})`
      );
    }
    const versions = await getReleasedVersionsAsync();
    const version = versions[sdkVersion];
    Log.debug(`Installing Expo Go version for SDK ${sdkVersion} at URL: ${version[versionsKey]}`);
    url = version[versionsKey] as string;
  }

  const filename = path.parse(url).name;

  try {
    const outputPath = getFilePath(filename);
    Log.debug(`Downloading Expo Go from "${url}" to "${outputPath}".`);
    Log.debug(
      `The requested copy of Expo Go might already be cached in: "${getExpoHomeDirectory()}". You can disable the cache with EXPO_NO_CACHE=1`
    );
    await profile(downloadAppAsync)({
      url,
      // Save all encrypted cache data to `~/.expo/expo-go`
      cacheDirectory: 'expo-go',
      outputPath,
      extract: shouldExtractResults,
      onProgress({ progress }) {
        if (bar) {
          bar.tick(1, progress);
        }
      },
    });
    return outputPath;
  } finally {
    bar.terminate();
    setProgressBar(null);
  }
}
