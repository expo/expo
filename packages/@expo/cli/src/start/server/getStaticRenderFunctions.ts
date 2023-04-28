/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import requireString from 'require-from-string';
import resolveFrom from 'resolve-from';

import { delayAsync } from '../../utils/delay';
import { memoize } from '../../utils/fn';
import { profile } from '../../utils/profile';
import { getMetroServerRoot } from './middleware/ManifestMiddleware';

const debug = require('debug')('expo:start:server:node-renderer') as typeof console.log;

function wrapBundle(str: string) {
  // Skip the metro runtime so debugging is a bit easier.
  // Replace the __r() call with an export statement.
  return str.replace(/^(__r\(.*\);)$/m, 'module.exports = $1');
}

function stripProcess(str: string) {
  // TODO: Remove from the metro prelude
  return str.replace(/process=this\.process\|\|{},/m, '');
}

// TODO(EvanBacon): Group all the code together and version.
const getRenderModuleId = (projectRoot: string): string => {
  const moduleId = resolveFrom.silent(projectRoot, 'expo-router/node/render.js');
  if (!moduleId) {
    throw new Error(
      `A version of expo-router with Node.js support is not installed in the project.`
    );
  }

  return moduleId;
};

type StaticRenderOptions = {
  // Ensure the style format is `css-xxxx` (prod) instead of `css-view-xxxx` (dev)
  dev?: boolean;
  minify?: boolean;
  platform?: string;
  environment?: 'node';
};

const moveStaticRenderFunction = memoize(async (projectRoot: string, requiredModuleId: string) => {
  // Copy the file into the project to ensure it works in monorepos.
  // This means the file cannot have any relative imports.
  const tempDir = path.join(projectRoot, '.expo/static');
  await fs.promises.mkdir(tempDir, { recursive: true });
  const moduleId = path.join(tempDir, 'render.js');
  await fs.promises.writeFile(moduleId, await fs.promises.readFile(requiredModuleId, 'utf8'));
  // Sleep to give watchman time to register the file.
  await delayAsync(50);
  return moduleId;
});

/** @returns the js file contents required to generate the static generation function. */
export async function getStaticRenderFunctionsContentAsync(
  projectRoot: string,
  devServerUrl: string,
  { dev = false, minify = false, environment }: StaticRenderOptions = {}
): Promise<string> {
  const root = getMetroServerRoot(projectRoot);
  const requiredModuleId = getRenderModuleId(root);
  let moduleId = requiredModuleId;

  // Cannot be accessed using Metro's server API, we need to move the file
  // into the project root and try again.
  if (path.relative(root, moduleId).startsWith('..')) {
    moduleId = await moveStaticRenderFunction(projectRoot, requiredModuleId);
  }

  return requireFileContentsWithMetro(root, devServerUrl, moduleId, { dev, minify, environment });
}

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

export async function createMetroEndpointAsync(
  projectRoot: string,
  devServerUrl: string,
  absoluteFilePath: string,
  { dev = false, platform = 'web', minify = false, environment }: StaticRenderOptions = {}
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

export async function requireFileContentsWithMetro(
  projectRoot: string,
  devServerUrl: string,
  absoluteFilePath: string,
  props: StaticRenderOptions = {}
): Promise<string> {
  const url = await createMetroEndpointAsync(projectRoot, devServerUrl, absoluteFilePath, props);

  const res = await fetch(url);

  // TODO: Improve error handling
  if (res.status === 500) {
    const text = await res.text();
    if (text.startsWith('{"originModulePath"')) {
      const errorObject = JSON.parse(text);
      throw new Error(errorObject.message);
    }
    throw new Error(`[${res.status}]: ${res.statusText}\n${text}`);
  }

  if (!res.ok) {
    throw new Error(`Error fetching bundle for static rendering: ${res.status} ${res.statusText}`);
  }

  const content = await res.text();

  let bun = wrapBundle(content);

  // This exposes the entire environment to the bundle.
  if (props.environment === 'node') {
    bun = stripProcess(bun);
  }

  return bun;
}
export async function requireWithMetro<T>(
  projectRoot: string,
  devServerUrl: string,
  absoluteFilePath: string,
  options: StaticRenderOptions = {}
): Promise<T> {
  const content = await requireFileContentsWithMetro(
    projectRoot,
    devServerUrl,
    absoluteFilePath,
    options
  );

  return profile(requireString, 'eval-metro-bundle')(content);
}

export async function getStaticRenderFunctions(
  projectRoot: string,
  devServerUrl: string,
  options: StaticRenderOptions = {}
): Promise<any> {
  const scriptContents = await getStaticRenderFunctionsContentAsync(
    projectRoot,
    devServerUrl,
    options
  );
  return profile(requireString, 'eval-metro-bundle')(scriptContents);
}
