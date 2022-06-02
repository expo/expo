import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import * as Simulator from './simulator';

const EXPORT_PUBLIC_URL = 'https://u.expo.dev/dummy-url';
let bundlePath: string | null = null;

function findBundlePath(updateDistPath: string): string {
  if (!bundlePath) {
    const classicManifest = require(path.join(updateDistPath, Simulator.ExportedManifestFilename));
    const { bundleUrl }: { bundleUrl: string } = classicManifest;
    bundlePath = path.join(updateDistPath, bundleUrl.replace(EXPORT_PUBLIC_URL, ''));
  }
  return bundlePath;
}

export async function copyBundleToStaticFolder(
  updateDistPath: string,
  filename: string,
  notifyString?: string
): Promise<string> {
  const staticFolder = path.resolve(__dirname, '..', '.static');
  await fs.mkdir(staticFolder, { recursive: true });
  let bundleString = await fs.readFile(findBundlePath(updateDistPath), 'utf-8');
  if (notifyString) {
    bundleString = bundleString.replace('/notify/test', `/notify/${notifyString}`);
  }
  await fs.writeFile(path.join(staticFolder, filename), bundleString, 'utf-8');
  return crypto.createHash('sha256').update(bundleString, 'utf-8').digest('base64url');
}
