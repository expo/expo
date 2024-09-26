#!/usr/bin/env yarn --silent ts-node --transpile-only

import spawnAsync from '@expo/spawn-async';
import { type WriteStream, createWriteStream } from 'fs';
import fs from 'fs/promises';
import https from 'https';
import path from 'path';
import { pipeline } from 'stream/promises';
import tar from 'tar';

const SQLITE_DOWNLOAD_URL = 'https://github.com/sqlite/sqlite/archive';
const SQLCIPHER_DOWNLOAD_URL = 'https://github.com/sqlcipher/sqlcipher/archive';
const DEFAULT_SQLITE_VERSION = '3.45.3';
const DEFAULT_SQLCIPHER_VERSION = '4.6.0';

async function runAsync() {
  const tarballOutputPath = 'sqlite.tar.gz';
  const workingDir = path.resolve('tmp');
  const { configureFlags, downloadUrl, outputDir } = getCommandArgs();
  try {
    console.log(`Downloading SQLite tarball from ${downloadUrl}`);
    await downloadFileAsync(downloadUrl, tarballOutputPath);

    console.log(`Extracting SQLite tarball`);
    await fs.mkdir(workingDir, { recursive: true });
    await extractTarballAsync(tarballOutputPath, workingDir);

    console.log(`Building SQLite source`);
    await buildSqliteAsync({ configureFlags, workingDir });

    console.log(`Copying SQLite source to ${outputDir}`);
    await fs.mkdir(outputDir, { recursive: true });
    const outputFiles = ['sqlite3.c', 'sqlite3.h'];
    await Promise.all([
      outputFiles.map((file) =>
        fs.copyFile(path.join(workingDir, file), path.join(outputDir, file))
      ),
    ]);
  } finally {
    await fs.unlink(tarballOutputPath).catch(() => {});
    await fs.rm(workingDir, { recursive: true }).catch(() => {});
  }
}

(async () => {
  try {
    await runAsync();
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

function getCommandArgs(): {
  configureFlags: string[];
  downloadUrl: string;
  isSqlCipher: boolean;
  outputDir: string;
} {
  const programName = path.basename(process.argv[1]);
  if (process.argv.length < 3) {
    console.log(`Usage: ${programName} <outputDir> [version] [--sqlcipher]`);
    process.exit(1);
  }
  let args = process.argv.slice(2);
  const isSqlCipher = args.includes('--sqlcipher');
  if (isSqlCipher) {
    args = args.filter((arg) => arg !== '--sqlcipher');
  }
  const outputDir = path.resolve(args[0]);

  let configureFlags: string[];
  let downloadUrl: string;
  if (isSqlCipher) {
    // When configuring on macOS, use the commoncrypto library for encryption.
    // For Android, this could be overridden with `-DSQLCIPHER_CRYPTO_OPENSSL`.
    configureFlags = ['--with-crypto-lib=commoncrypto'];
    const version = args[1] || DEFAULT_SQLCIPHER_VERSION;
    const tag = `v${version}`;
    downloadUrl = `${SQLCIPHER_DOWNLOAD_URL}/${tag}/${tag}.tar.gz`;
  } else {
    configureFlags = [];
    const version = args[1] || DEFAULT_SQLITE_VERSION;
    const tag = `version-${version}`;
    downloadUrl = `${SQLITE_DOWNLOAD_URL}/${tag}/sqlite-${version}.tar.gz`;
  }
  return {
    configureFlags,
    downloadUrl,
    isSqlCipher,
    outputDir,
  };
}

async function downloadFileAsync(url: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let fileStream: WriteStream | null = null;
    const request = https.get(url, async (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        try {
          const result = await downloadFileAsync(response.headers.location, outputPath);
          resolve(result);
        } catch (err) {
          reject(err);
        }
        return;
      }

      fileStream = createWriteStream(outputPath);
      fileStream.on('error', (err) => {
        request.destroy();
        reject(err);
      });

      try {
        await pipeline(response, fileStream);
        resolve(outputPath);
      } catch (err) {
        response.resume(); // Ensure the response is consumed in case of error
        reject(err);
      } finally {
        fileStream.close();
      }
    });

    request.on('error', (err) => {
      fileStream?.close();
      reject(err);
    });
  });
}

async function extractTarballAsync(filePath: string, outputDir: string): Promise<void> {
  await tar.x({
    file: filePath,
    cwd: outputDir,
    strip: 1,
  });
}

async function buildSqliteAsync({
  configureFlags,
  workingDir,
}: {
  configureFlags: string[];
  workingDir: string;
}): Promise<void> {
  await spawnAsync('./configure', configureFlags, {
    shell: true,
    cwd: workingDir,
    stdio: 'inherit',
  });

  await spawnAsync('make', ['sqlite3.c'], {
    shell: true,
    cwd: workingDir,
    stdio: 'inherit',
  });
}
