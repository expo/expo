const crypto = require('crypto');
const { createReadStream } = require('fs');
const fs = require('fs/promises');
const path = require('path');

const STATIC_FOLDER_PATH = path.resolve(__dirname, '..', '.static');
const EXPORT_PUBLIC_URL = 'https://u.expo.dev/dummy-url';

function exportedManifestFilename(platform) {
  return `${platform}-index.json`;
}

function findBundlePath(updateDistPath, platform) {
  const classicManifest = require(path.join(updateDistPath, exportedManifestFilename(platform)));
  const { bundleUrl } = classicManifest;
  return path.join(updateDistPath, bundleUrl.replace(EXPORT_PUBLIC_URL, ''));
}

async function copyBundleToStaticFolder(
  updateDistPath,
  filename,
  notifyString,
  platform
) {
  await fs.mkdir(STATIC_FOLDER_PATH, { recursive: true });
  let bundleString = await fs.readFile(findBundlePath(updateDistPath, platform), 'utf-8');
  if (notifyString) {
    bundleString = bundleString.replace('/notify/test', `/notify/${notifyString}`);
  }
  await fs.writeFile(path.join(STATIC_FOLDER_PATH, filename), bundleString, 'utf-8');
  return crypto.createHash('sha256').update(bundleString, 'utf-8').digest('base64url');
}

async function copyAssetToStaticFolder(
  sourcePath,
  filename
) {
  await fs.mkdir(STATIC_FOLDER_PATH, { recursive: true });
  const destinationPath = path.join(STATIC_FOLDER_PATH, filename);
  await fs.copyFile(sourcePath, destinationPath);

  const hash = crypto.createHash('sha256');
  const stream = createReadStream(destinationPath);
  return new Promise((resolve, reject) => {
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('base64url')));
  });
}

const Updates = {
  copyBundleToStaticFolder,
  copyAssetToStaticFolder,
  exportedManifestFilename,
};

module.exports = Updates;