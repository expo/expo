import * as crypto from 'crypto';
import { createReadStream } from 'fs';
import type { PathLike } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';

const STATIC_FOLDER_PATH = path.resolve(__dirname, '..', '.static');
const RUNTIME_VERSION = '1.0.0';
const serverHost = process.env.UPDATES_HOST;
const serverPort = parseInt(process.env.UPDATES_PORT || '', 10);

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
      `There is no bundle for notifyString = ${notifyString}. Please add this to the strings used to generate test bundles in 'project.js' (setupBasicAppAsync() or setupAssetsAppAsync())'`
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
  assets: any[]
) {
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
    extra: {},
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

export default {
  copyBundleToStaticFolder,
  copyAssetToStaticFolder,
  findAssets,
  getUpdateManifestForBundleFilename,
  getRollbackDirective,
  getNoUpdateAvailableDirective,
  serverHost,
  serverPort,
};
