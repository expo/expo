const crypto = require('crypto');
const { createReadStream } = require('fs');
const fs = require('fs/promises');
const path = require('path');

const STATIC_FOLDER_PATH = path.resolve(__dirname, '..', '.static');

function findBundlePath(projectRoot, platform, notifyString) {
  const testUpdateBundlesPath = path.join(projectRoot, 'test-update-bundles');
  const testUpdateBundlesJsonPath = path.join(testUpdateBundlesPath, 'test-updates.json');
  const testUpdateBundlesJson = require(testUpdateBundlesJsonPath);
  const bundleUrl = testUpdateBundlesJson[notifyString][platform];
  return path.join(testUpdateBundlesPath, bundleUrl);
}

function findAssets(projectRoot, platform) {
  const updatesPath = path.join(projectRoot, 'updates');
  const updatesJson = require(path.join(updatesPath, 'metadata.json'));
  const assets = updatesJson.fileMetadata[platform].assets;
  return assets.map(asset => {
    return {
      path: path.join(updatesPath, asset.path),
      ext: asset.ext
    };
  });
}

async function shaHash(filePath) {
  const hash = crypto.createHash('sha256');
  const stream = createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('base64url')));
  });
}

async function copyBundleToStaticFolder(projectRoot, filename, notifyString, platform) {
  await fs.mkdir(STATIC_FOLDER_PATH, { recursive: true });
  const bundleSrcPath = findBundlePath(projectRoot, platform, notifyString);
  const bundleDestPath = path.join(STATIC_FOLDER_PATH, filename);
  await fs.copyFile(bundleSrcPath, bundleDestPath);
  return await shaHash(bundleDestPath);
}

async function copyAssetToStaticFolder(sourcePath, filename) {
  await fs.mkdir(STATIC_FOLDER_PATH, { recursive: true });
  const destinationPath = path.join(STATIC_FOLDER_PATH, filename);
  await fs.copyFile(sourcePath, destinationPath);
  return await shaHash(destinationPath);
}

const Updates = {
  copyBundleToStaticFolder,
  copyAssetToStaticFolder,
  findAssets,
};

module.exports = Updates;
