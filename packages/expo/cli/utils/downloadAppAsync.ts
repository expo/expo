import { getExpoHomeDirectory } from '@expo/config/build/getUserState';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';
import ProgressBar from 'progress';
import { Stream } from 'stream';
import tar from 'tar';
import { promisify } from 'util';

import UserSettings from '../start/api/UserSettings';
import * as Versions from '../start/api/Versions';
import { CommandError } from './errors';
import { setProgressBar } from './progress';

const TIMER_DURATION = 30000;

export type ProgressCallback = (progressPercentage: number) => void;
const pipeline = promisify(Stream.pipeline);

async function _downloadAsync(
  url: string,
  outputPath: string,
  progressFunction?: ProgressCallback
) {
  const res = await fetch(url, { timeout: TIMER_DURATION });
  if (!res.ok) {
    throw new CommandError(`Unexpected response: ${res.statusText}. From url: ${url}`);
  }
  const totalDownloadSize = res.headers.get('Content-Length');
  const resourceSize = parseInt(totalDownloadSize, 10);

  /* Keep track of download progress */
  res.body.on('readable', () => {
    let chunk;
    let length: number = 0;
    let downloadProgressAsPercentage: number = 0;

    while (null !== (chunk = res.body.read())) {
      length += chunk.length;
      downloadProgressAsPercentage = Math.floor((length / resourceSize) * 100);
      if (progressFunction) {
        progressFunction(downloadProgressAsPercentage);
      }
    }
  });

  return pipeline(res.body, fs.createWriteStream(outputPath));
}

export async function downloadAppAsync(
  url: string,
  outputPath: string,
  { extract = false } = {},
  progressFunction?: ProgressCallback
): Promise<void> {
  if (extract) {
    const dotExpoHomeDirectory = UserSettings.getDirectory();
    const tmpPath = path.join(dotExpoHomeDirectory, 'tmp-download-file');
    await _downloadAsync(url, tmpPath, progressFunction);
    await extractAsync(tmpPath, outputPath);
    fs.removeSync(tmpPath);
  } else {
    await _downloadAsync(url, outputPath, progressFunction);
  }
}

export async function extractAsync(archive: string, dir: string): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      await spawnAsync('tar', ['-xf', archive, '-C', dir], {
        stdio: 'inherit',
        cwd: __dirname,
      });
      return;
    }
  } catch (e) {
    console.error(e.message);
  }
  // tar node module has previously had problems with big files, and seems to
  // be slower, so only use it as a backup.
  await tar.extract({ file: archive, cwd: dir });
}

const platformSettings: Record<
  string,
  {
    shouldExtractResults: boolean;
    versionsKey: keyof Awaited<ReturnType<typeof Versions.getVersionsAsync>>;
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

export async function downloadExpoGoForPlatformAsync(
  platform: keyof typeof platformSettings,
  {
    url,
  }: {
    url?: string;
  } = {}
) {
  const bar = new ProgressBar('Downloading the Expo Go app [:bar] :percent :etas', {
    width: 64,
    total: 100,
    clear: true,
    complete: '=',
    incomplete: ' ',
  });
  // TODO: Auto track progress
  setProgressBar(bar);

  const settings = platformSettings[platform];

  if (!url) {
    const versions = await Versions.getVersionsAsync();
    url = versions[settings.versionsKey] as string;
  }

  const filename = path.parse(url).name;

  try {
    return await _downloadAppAsync({
      url,
      filepath: settings.getFilePath(filename),
      extract: settings.shouldExtractResults,
      downloadProgressCallback(progress) {
        if (bar) {
          bar.tick(1, progress);
        }
      },
    });
  } finally {
    bar.terminate();
    setProgressBar(null);
  }
}

async function _downloadAppAsync({
  url,
  filepath,
  extract,
  downloadProgressCallback,
}: {
  url: string;
  filepath: string;
  extract: boolean;
  downloadProgressCallback?: ProgressCallback;
}) {
  if (await fs.pathExists(filepath)) {
    const filesInDir = await fs.readdir(filepath);
    if (filesInDir.length > 0) {
      return filepath;
    } else {
      fs.removeSync(filepath);
    }
  }

  fs.mkdirpSync(filepath);
  try {
    await downloadAppAsync(url, filepath, { extract }, downloadProgressCallback);
  } catch (e) {
    fs.removeSync(filepath);
    throw e;
  }

  return filepath;
}
