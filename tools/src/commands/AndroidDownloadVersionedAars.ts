import { Command } from '@expo/commander';
import fs from 'fs-extra';
import got from 'got';
import os from 'os';
import path from 'path';
import semver from 'semver';
import stream from 'stream';
import { promisify } from 'util';

import { ANDROID_DIR } from '../Constants';
import { getSDKVersionsAsync } from '../ProjectVersions';
import { runWithSpinner } from '../Utils';

const DOWNLOAD_BASE = 'https://github.com/expo/react-native/releases/download/';

/**
 * Gets file mtime
 */
async function getFileModifedAsync(filePath: string): Promise<string | null> {
  let result: string | null = null;
  try {
    const stat = await fs.stat(filePath);
    result = stat.mtime.toUTCString();
  } catch {
    result = null;
  }
  return result;
}

/**
 * Downloads data and save to file.
 *
 * - Supports streaming
 * - If original file is existed, trying to send `If-Modified-Since` header
 */
async function downloadFileAsync(url: string, outputPath: string) {
  const headers = {};

  const outputModified = await getFileModifedAsync(outputPath);
  if (outputModified) {
    headers['If-Modified-Since'] = outputModified;
  }

  const pipeline = promisify(stream.pipeline);
  const fileName = path.basename(url);
  const tmpFilePath = path.join(os.tmpdir(), fileName);
  await pipeline(got.stream(url, { headers }), fs.createWriteStream(tmpFilePath));
  const fileSize = (await fs.stat(tmpFilePath)).size;

  if (fileSize === 0) {
    // If-Modified-Since cache hit
    await fs.remove(tmpFilePath);
  } else {
    await fs.move(tmpFilePath, outputPath, { overwrite: true });
  }
}

/**
 * Variant of `downloadFileAsync` without throwing exceptions even downloading failed.
 * We need this when adding versioned code before uploading aar to GitHub.
 */
async function downloadFileNonThrowAsync(url: string, outputPath: string) {
  try {
    await downloadFileAsync(url, outputPath);
  } catch {}
}

/**
 * Download a versioned aar
 */
async function downloadVersionedAarAsync(sdkVersion: string) {
  const abiVersion = `abi${sdkVersion.replace(/\./g, '_')}`;
  const url = `${DOWNLOAD_BASE}sdk-${sdkVersion}/reactandroid-${abiVersion}-1.0.0.aar`;
  const outputFile = path.join(
    ANDROID_DIR,
    `versioned-abis/expoview-${abiVersion}`,
    `maven/host/exp/reactandroid-${abiVersion}/1.0.0/reactandroid-${abiVersion}-1.0.0.aar`
  );
  await runWithSpinner(
    `Downloading versioned AAR for SDK ${sdkVersion}: ${url}`,
    () => downloadFileNonThrowAsync(url, outputFile),
    `Downloaded versioned AAR for SDK ${sdkVersion}`,
    {
      // Gradle does not handle the interactive spinner well. Let's use in plain text mode.
      isEnabled: false,
    }
  );
}

async function action(): Promise<void> {
  const sdkVersions = await getSDKVersionsAsync('android');
  for (const sdkVersion of sdkVersions) {
    if (semver.gte(sdkVersion, '48.0.0')) {
      await downloadVersionedAarAsync(sdkVersion);
    }
  }
}

export default (program: Command) => {
  program
    .command('android-download-versioned-aars')
    .description('Download versioned AAR files for Expo Go.')
    .asyncAction(action);
};
