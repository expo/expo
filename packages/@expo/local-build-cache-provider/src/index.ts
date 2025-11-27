import {
  BuildCacheProviderPlugin,
  ResolveBuildCacheProps,
  RunOptions,
  UploadBuildCacheProps,
} from '@expo/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

type Options = {
  cacheDir?: string;
};

async function resolveBuildCacheAsync(
  { projectRoot, platform, fingerprintHash, runOptions }: ResolveBuildCacheProps,
  options: Options = {}
): Promise<string | null> {
  const cacheDir = options?.cacheDir ?? path.join(projectRoot, '.expo', 'build-cache');

  if (!fs.existsSync(cacheDir)) {
    console.debug('Local build cache directory does not exist, skipping check');
    return null;
  }

  const expectedFile = `${platform}-${fingerprintHash}-${getBuildVariant(runOptions)}`;
  const files = fs.readdirSync(cacheDir);

  const file = files.find((file) => file.includes(expectedFile));
  if (!file) {
    console.debug('No matching builds found in local cache, starting build process');
    return null;
  }

  return path.join(cacheDir, file);
}

async function uploadBuildCacheAsync(
  { projectRoot, platform, fingerprintHash, buildPath, runOptions }: UploadBuildCacheProps,
  options: Options = {}
): Promise<string | null> {
  const cacheDir = options?.cacheDir ?? path.join(projectRoot, '.expo', 'build-cache');

  if (!fs.existsSync(cacheDir)) {
    console.debug(
      'Build cache directory does not exist, creating build cache folder at:',
      cacheDir
    );

    fs.mkdirSync(cacheDir, { recursive: true });
  }

  try {
    console.log(chalk`{whiteBright \u203A} {bold Copying build to local cache}`);
    const destFile = `${platform}-${fingerprintHash}-${getBuildVariant(runOptions)}${path.extname(buildPath)}`;
    const destPath = path.join(cacheDir, destFile);

    // Remove existing cache entry if it exists.
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }

    const stats = fs.statSync(buildPath);
    // iOS builds are usually directories, Android builds are usually files.
    if (stats.isDirectory()) {
      fs.cpSync(buildPath, destPath, { recursive: true });
    } else if (stats.isFile()) {
      fs.copyFileSync(buildPath, destPath);
    } else {
      console.debug('Unsupported build artifact type for caching:', buildPath);
      return null;
    }
    return destPath;
  } catch (error) {
    console.debug(' error:', error);
  }
  return null;
}

function getBuildVariant(runOptions: RunOptions): string {
  if ('variant' in runOptions && runOptions.variant !== undefined) {
    return runOptions.variant;
  }
  if ('configuration' in runOptions && runOptions.configuration !== undefined) {
    return runOptions.configuration;
  }

  return 'unknown';
}

const LocalBuildCacheProvider: BuildCacheProviderPlugin = {
  resolveBuildCache: resolveBuildCacheAsync,
  uploadBuildCache: uploadBuildCacheAsync,
};

export default LocalBuildCacheProvider;
