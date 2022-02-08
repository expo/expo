import { getExpoHomeDirectory } from '@expo/config/build/getUserState';
import path from 'path';
import ProgressBar from 'progress';

import { getVersionsAsync } from '../api/getVersions';
import * as Log from '../log';
import { downloadAppAsync } from './downloadAppAsync';
import { profile } from './profile';
import { setProgressBar } from './progress';

const platformSettings: Record<
  string,
  {
    shouldExtractResults: boolean;
    versionsKey: keyof Awaited<ReturnType<typeof getVersionsAsync>>;
    getFilePath: (filename: string) => string;
  }
> = {
  ios: {
    versionsKey: 'iosUrl',
    getFilePath: (filename) =>
      path.join(getExpoHomeDirectory(), 'ios-simulator-app-cache', `${filename}.app`),
    shouldExtractResults: true,
  },
  android: {
    versionsKey: 'androidUrl',
    getFilePath: (filename) =>
      path.join(getExpoHomeDirectory(), 'android-apk-cache', `${filename}.apk`),
    shouldExtractResults: false,
  },
};

export async function downloadExpoGoAsync(
  platform: keyof typeof platformSettings,
  {
    url,
  }: {
    url?: string;
  } = {}
) {
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
    const versions = await getVersionsAsync();
    url = versions[versionsKey] as string;
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
