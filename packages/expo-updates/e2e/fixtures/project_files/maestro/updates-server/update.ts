const spawnAsync = require('@expo/spawn-async');
const crypto = require('crypto');
const createReadStream = require('fs').createReadStream;
const pipeline = require('stream/promises').pipeline;
const fs = require('fs/promises');
const path = require('path');
const resolveFrom = require('resolve-from');
const silentResolveFrom = require('resolve-from').silent;
const nullthrows = require('nullthrows');

import type { PathLike } from 'fs';

const STATIC_FOLDER_PATH = path.resolve(__dirname, '..', '.static');
const RUNTIME_VERSION = '1.0.0';

const serverHost = 'localhost';
const serverPort = parseInt(process.env.MAESTRO_UPDATES_SERVER_PORT, 10);

if (!serverHost || isNaN(serverPort)) {
  console.error(
    `UPDATES_HOST: "${String(serverHost)}" or UPDATES_PORT: "${String(
      serverPort
    )}" is not defined. Check the readme for instructions.`
  );
}

const urlForBundleFilename = (bundleFilename: any) =>
  `http://${serverHost}:${serverPort}/static/${bundleFilename}`;

/**
 * Find the pregenerated bundle corresponding to the string that is expected
 * in the responses for a given E2E test
 */
function findBundlePath(
  projectRoot: string,
  platform: string | number,
  notifyString: string | number
) {
  const testUpdateBundlesPath = path.join(projectRoot, 'test-update-bundles');
  const testUpdateBundlesJsonPath = path.join(testUpdateBundlesPath, 'test-updates.json');
  const testUpdateBundlesJson = require(testUpdateBundlesJsonPath);
  const bundleJson = testUpdateBundlesJson[notifyString];
  if (bundleJson) {
    const bundleUrl = testUpdateBundlesJson[notifyString][platform];
    return path.join(testUpdateBundlesPath, bundleUrl);
  } else {
    throw new Error(
      `There is no bundle for notifyString = ${notifyString}. Add this to the strings used to generate test bundles in 'project.js' (setupBasicAppAsync() or setupAssetsAppAsync())'`
    );
  }
}

/**
 * Returns all the assets in the updates bundle, both paths and file types
 */
function findAssets(projectRoot: string, platform: string | number) {
  const updatesPath = path.join(projectRoot, 'updates');
  const updatesJson = require(path.join(updatesPath, 'metadata.json'));
  const assets = updatesJson.fileMetadata[platform].assets;
  return assets.map((asset: { path: string; ext: any }) => {
    return {
      path: path.join(updatesPath, asset.path),
      ext: asset.ext,
    };
  });
}

async function shaHash(filePath: PathLike) {
  const hash = crypto.createHash('sha256');
  const stream = createReadStream(filePath);
  await pipeline(stream, hash);
  return hash.digest('base64url');
}

/**
 * Copies a bundle to the location where the test server reads it,
 * and returns the SHA hash
 */
async function copyBundleToStaticFolder(
  projectRoot: any,
  filename: string,
  notifyString: any,
  platform: any
) {
  await fs.mkdir(STATIC_FOLDER_PATH, { recursive: true });
  const bundleSrcPath = findBundlePath(projectRoot, platform, notifyString);
  const bundleDestPath = path.join(STATIC_FOLDER_PATH, filename);
  await fs.copyFile(bundleSrcPath, bundleDestPath);
  return await shaHash(bundleDestPath);
}

/**
 * Copies an asset to the location where the test server reads it,
 * and returns the SHA hash
 */
async function copyAssetToStaticFolder(sourcePath: PathLike, filename: string) {
  await fs.mkdir(STATIC_FOLDER_PATH, { recursive: true });
  const destinationPath = path.join(STATIC_FOLDER_PATH, filename);
  await fs.copyFile(sourcePath, destinationPath);
  return await shaHash(destinationPath);
}

/**
 * Common method used in all the tests to create valid update manifests
 */
function getUpdateManifestForBundleFilename(
  date: { toISOString: () => string },
  hash: string,
  key: string,
  bundleFilename: string,
  assets: any[],
  projectRoot: string
) {
  const appJson = require(`${projectRoot}/app.json`);
  return {
    id: crypto.randomUUID(),
    createdAt: date.toISOString(),
    runtimeVersion: RUNTIME_VERSION,
    launchAsset: {
      hash,
      key,
      contentType: 'application/javascript',
      url: urlForBundleFilename(bundleFilename),
    },
    assets,
    metadata: {},
    extra: {
      expoConfig: appJson.expo,
    },
  };
}

/**
 * Method used in the fingerprint test to get the fingerprint to serve the update.
 */
async function getUpdateManifestForBundleFilenameWithFingerprintRuntimeVersionAsync(
  date: { toISOString: () => string },
  hash: string,
  key: string,
  bundleFilename: string,
  assets: any[],
  projectRoot: string,
  platform: 'ios' | 'android'
) {
  const runtimeVersion = await getResolvedRuntimeVersionAsync(projectRoot, platform);
  const appJson = require(`${projectRoot}/app.json`);
  return {
    id: crypto.randomUUID(),
    createdAt: date.toISOString(),
    runtimeVersion,
    launchAsset: {
      hash,
      key,
      contentType: 'application/javascript',
      url: urlForBundleFilename(bundleFilename),
    },
    assets,
    metadata: {},
    extra: {
      expoConfig: appJson.expo,
    },
  };
}

/**
 * Common method used in all the tests to create valid rollback directives
 */
function getRollbackDirective(date: Date) {
  return {
    type: 'rollBackToEmbedded',
    parameters: {
      commitTime: date.toISOString(),
    },
  };
}

/**
 * Common method used to create "no update available" directives
 */
function getNoUpdateAvailableDirective() {
  return {
    type: 'noUpdateAvailable',
  };
}

async function getResolvedRuntimeVersionAsync(projectDir: string, platform: 'ios' | 'android') {
  // change to true to get more detailed github output
  const printDebug = false;

  const resolvedRuntimeVersionJSONResult = await expoUpdatesCommandAsync(projectDir, [
    'runtimeversion:resolve',
    '--platform',
    platform,
    '--workflow',
    'generic',
    ...(printDebug ? ['--debug'] : []),
  ]);
  const runtimeVersionResult = JSON.parse(resolvedRuntimeVersionJSONResult);
  if (printDebug) {
    console.log('Resolved runtime version', resolvedRuntimeVersionJSONResult);
  }
  return nullthrows(runtimeVersionResult.runtimeVersion);
}

async function expoUpdatesCommandAsync(projectDir: string, args: string[]): Promise<string> {
  const expoUpdatesCli =
    silentResolveFrom(projectDir, 'expo-updates/bin/cli') ??
    resolveFrom(projectDir, 'expo-updates/bin/cli.js');
  return (await spawnAsync(expoUpdatesCli, args, { stdio: 'pipe' })).stdout;
}

const Update = {
  copyBundleToStaticFolder,
  copyAssetToStaticFolder,
  findAssets,
  getUpdateManifestForBundleFilename,
  getUpdateManifestForBundleFilenameWithFingerprintRuntimeVersionAsync,
  getRollbackDirective,
  getNoUpdateAvailableDirective,
  serverHost,
  serverPort,
};

module.exports = { Update };
