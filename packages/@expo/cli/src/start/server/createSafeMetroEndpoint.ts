/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';

import { getMetroServerRoot } from './middleware/ManifestMiddleware';
import { delayAsync } from '../../utils/delay';

const debug = require('debug')('expo:start:server:node-renderer') as typeof console.log;

type StaticRenderOptions = {
  // Ensure the style format is `css-xxxx` (prod) instead of `css-view-xxxx` (dev)
  dev?: boolean;
  minify?: boolean;
  platform?: string;
  environment?: 'node';
};

/** @returns the js file contents required to generate the static generation function. */
async function ensureFileInRootDirectory(projectRoot: string, otherFile: string) {
  // Cannot be accessed using Metro's server API, we need to move the file
  // into the project root and try again.
  if (!path.relative(projectRoot, otherFile).startsWith('../')) {
    return otherFile;
  }

  // Copy the file into the project to ensure it works in monorepos.
  // This means the file cannot have any relative imports.
  const tempDir = path.join(projectRoot, '.expo/static-tmp');
  await fs.promises.mkdir(tempDir, { recursive: true });
  const moduleId = path.join(tempDir, path.basename(otherFile));
  await fs.promises.writeFile(moduleId, await fs.promises.readFile(otherFile, 'utf8'));
  // Sleep to give watchman time to register the file.
  await delayAsync(50);
  return moduleId;
}

export async function createSafeMetroEndpointAsync(
  projectRoot: string,
  devServerUrl: string,
  absoluteFilePath: string,
  { dev = true, platform = 'web', minify = false, environment }: StaticRenderOptions = {}
): Promise<string> {
  const root = getMetroServerRoot(projectRoot);
  const safeOtherFile = await ensureFileInRootDirectory(projectRoot, absoluteFilePath);
  const serverPath = path.relative(root, safeOtherFile).replace(/\.[jt]sx?$/, '.bundle');
  debug('fetching from Metro:', root, serverPath);

  let url = `${devServerUrl}/${serverPath}?platform=${platform}&dev=${dev}&minify=${minify}`;

  if (environment) {
    url += `&resolver.environment=${environment}&transform.environment=${environment}`;
  }
  return url;
}
