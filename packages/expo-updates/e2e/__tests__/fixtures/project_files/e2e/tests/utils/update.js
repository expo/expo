const crypto = require('crypto');
const { createReadStream } = require('fs');
const fs = require('fs/promises');
const path = require('path');
const { pipeline } = require('stream/promises');

const STATIC_FOLDER_PATH = path.resolve(__dirname, '..', '.static');
const RUNTIME_VERSION = '1.0.0';
const serverHost = process.env.UPDATES_HOST;
const serverPort = parseInt(process.env.UPDATES_PORT || '', 10);

const urlForBundleFilename = (bundleFilename) =>
  `http://${serverHost}:${serverPort}/static/${bundleFilename}`;

/**
 * Find the pregenerated bundle corresponding to the string that is expected
 * in the responses for a given E2E test
 */
function findBundlePath(projectRoot, platform, notifyString) {
  const testUpdateBundlesPath = path.join(projectRoot, 'test-update-bundles');
  const testUpdateBundlesJsonPath = path.join(testUpdateBundlesPath, 'test-updates.json');
  const testUpdateBundlesJson = require(testUpdateBundlesJsonPath);
  const bundleUrl = testUpdateBundlesJson[notifyString][platform];
  return path.join(testUpdateBundlesPath, bundleUrl);
}

/**
 * Returns all the assets in the updates bundle, both paths and file types
 */
function findAssets(projectRoot, platform) {
  const updatesPath = path.join(projectRoot, 'updates');
  const updatesJson = require(path.join(updatesPath, 'metadata.json'));
  const assets = updatesJson.fileMetadata[platform].assets;
  return assets.map((asset) => {
    return {
      path: path.join(updatesPath, asset.path),
      ext: asset.ext,
    };
  });
}

async function shaHash(filePath) {
  const hash = crypto.createHash('sha256');
  const stream = createReadStream(filePath);
  await pipeline(stream, hash);
  return hash.digest('base64url');
}

/**
 * Copies a bundle to the location where the test server reads it,
 * and returns the SHA hash
 */
async function copyBundleToStaticFolder(projectRoot, filename, notifyString, platform) {
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
async function copyAssetToStaticFolder(sourcePath, filename) {
  await fs.mkdir(STATIC_FOLDER_PATH, { recursive: true });
  const destinationPath = path.join(STATIC_FOLDER_PATH, filename);
  await fs.copyFile(sourcePath, destinationPath);
  return await shaHash(destinationPath);
}

/**
 * Common method used in all the tests to create valid update manifests
 */
function getUpdateManifestForBundleFilename(date, hash, key, bundleFilename, assets) {
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

const Updates = {
  copyBundleToStaticFolder,
  copyAssetToStaticFolder,
  findAssets,
  getUpdateManifestForBundleFilename,
  serverHost,
  serverPort,
};

module.exports = Updates;
