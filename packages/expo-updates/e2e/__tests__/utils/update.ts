import crypto from 'crypto';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import * as Simulator from './simulator';

const STATIC_FOLDER_PATH = path.resolve(__dirname, '..', '.static');
const EXPORT_PUBLIC_URL = 'https://u.expo.dev/dummy-url';

function findBundlePath(updateDistPath: string): string {
  const classicManifest = require(path.join(updateDistPath, Simulator.ExportedManifestFilename));
  const { bundleUrl }: { bundleUrl: string } = classicManifest;
  return path.join(updateDistPath, bundleUrl.replace(EXPORT_PUBLIC_URL, ''));
}

export async function copyBundleToStaticFolder(
  updateDistPath: string,
  filename: string,
  notifyString: string
): Promise<string> {
  await fs.mkdir(STATIC_FOLDER_PATH, { recursive: true });
  let bundleString = await fs.readFile(findBundlePath(updateDistPath), 'utf-8');
  if (notifyString) {
    bundleString = bundleString.replace('/notify/test', `/notify/${notifyString}`);
  }
  await fs.writeFile(path.join(STATIC_FOLDER_PATH, filename), bundleString, 'utf-8');
  return crypto.createHash('sha256').update(bundleString, 'utf-8').digest('base64url');
}

export async function copyAssetToStaticFolder(
  sourcePath: string,
  filename: string
): Promise<string> {
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
