import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import * as Device from './device.ios'; // TODO: fix!!!!!

const EXPORT_PUBLIC_URL = 'https://expo.dev/dummy-url';
const BUNDLE_DIST_PATH = process.env.TEST_BUNDLE_DIST_PATH;
let bundlePath: string | null = null;

function findBundlePath(): string {
  if (!bundlePath) {
    const classicManifest = require(path.join(BUNDLE_DIST_PATH, Device.ExportedManifestFilename));
    const { bundleUrl }: { bundleUrl: string } = classicManifest;
    bundlePath = path.join(BUNDLE_DIST_PATH, bundleUrl.replace(EXPORT_PUBLIC_URL, ''));
  }
  return bundlePath;
}

export async function copyBundleToStaticFolder(
  filename: string,
  notifyString?: string
): Promise<string> {
  const staticFolder = path.join(__dirname, '.static');
  await fs.mkdir(staticFolder, { recursive: true });
  let bundleString = await fs.readFile(findBundlePath(), 'utf-8');
  if (notifyString) {
    bundleString = bundleString.replace('/notify/test', `/notify/${notifyString}`);
  }
  await fs.writeFile(path.join(staticFolder, filename), bundleString, 'utf-8');
  return crypto.createHash('sha256').update(bundleString, 'utf-8').digest('base64url');
}
