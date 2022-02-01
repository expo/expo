import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import fetch from 'node-fetch';
import path from 'path';
import { Stream } from 'stream';
import tar from 'tar';
import { promisify } from 'util';

import UserSettings from '../start/api/UserSettings';
import * as Versions from '../start/api/Versions';
import { CommandError } from './errors';

const TIMER_DURATION = 30000;

type ProgressCallback = (progressPercentage: number) => void;
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
    let recievedLength: number = 0;
    let downloadProgressAsPercentage: number = 0;

    while (null !== (chunk = res.body.read())) {
      console.log(`Received ${chunk.length} bytes of data.`);
      recievedLength += chunk.length;
      console.log('recieved', recievedLength, 'of', resourceSize, 'bytes');

      downloadProgressAsPercentage = Math.floor((recievedLength / resourceSize) * 100);
      console.log('Download percentage:', downloadProgressAsPercentage, '%');
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

function _apkCacheDirectory() {
  const dotExpoHomeDirectory = UserSettings.getDirectory();
  const dir = path.join(dotExpoHomeDirectory, 'android-apk-cache');
  fs.mkdirpSync(dir);
  return dir;
}

export async function downloadApkAsync(
  url?: string,
  downloadProgressCallback?: (roundedProgress: number) => void
) {
  if (!url) {
    const versions = await Versions.getVersionsAsync();
    url = versions.androidUrl;
  }

  const filename = path.parse(url).name;
  const apkPath = path.join(_apkCacheDirectory(), `${filename}.apk`);

  if (await fs.pathExists(apkPath)) {
    return apkPath;
  }

  await downloadAppAsync(url, apkPath, undefined, downloadProgressCallback);
  return apkPath;
}
