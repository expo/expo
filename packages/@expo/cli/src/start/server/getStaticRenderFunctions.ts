/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import requireString from 'require-from-string';
import resolveFrom from 'resolve-from';

import { profile } from '../../utils/profile';
import { getMetroServerRoot } from './middleware/ManifestMiddleware';
const debug = require('debug')('expo:start:server:node-renderer') as typeof console.log;

function wrapBundle(str: string) {
  // Skip the metro runtime so debugging is a bit easier.
  // Replace the __r() call with an export statement.
  return (
    'const NODE_GLOBAL = this;const NODE_REQUIRE = require;\n' +
    str.replace(/^(__r\(.*\);)$/m, 'module.exports = $1')
  );
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
};

/** @returns the js file contents required to generate the static generation function. */
export async function getStaticRenderFunctionsContentAsync(
  projectRoot: string,
  devServerUrl: string,
  { dev = false, minify = false, platform = 'web' }: StaticRenderOptions = {}
): Promise<string> {
  const root = getMetroServerRoot(projectRoot);
  const moduleId = getRenderModuleId(root);

  // Copy the file into the project to ensure it works in monorepos.
  // This means the file cannot have any relative imports.
  const tempDir = path.join(root, '.expo/static');
  await fs.promises.mkdir(tempDir, { recursive: true });
  const tempFile = path.join(tempDir, 'render.js');
  await fs.promises.writeFile(tempFile, await fs.promises.readFile(moduleId, 'utf8'));

  const serverPath = path.relative(projectRoot, tempFile).replace(/\.[jt]sx?$/, '.bundle');
  console.log(serverPath);
  debug('Loading render functions from:', tempFile, moduleId, root);

  const res = await fetch(
    `${devServerUrl}/${serverPath}?platform=${platform}&dev=${dev}&minify=${minify}&resolver.expo_mode=node`
    // `${devServerUrl}/${moduleId}.bundle?platform=web&dev=${dev}&minify=${minify}`
  );

  // TODO: Improve error handling
  if (res.status === 500) {
    const text = await res.text();
    if (text.startsWith('{"originModulePath"')) {
      const errorObject = JSON.parse(text);
      throw new Error(errorObject.message);
    }
  }

  if (!res.ok) {
    throw new Error(`Error fetching bundle for static rendering: ${res.status} ${res.statusText}`);
  }

  const content = await res.text();

  return wrapBundle(content);
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

export async function getStaticPageContentsAsync(
  projectRoot: string,
  devServerUrl: string,
  options: StaticRenderOptions = {}
) {
  const scriptContents = await getStaticRenderFunctionsContentAsync(
    projectRoot,
    devServerUrl,
    options
  );

  const { getStaticContentAsync, getDataLoader } = profile(
    requireString,
    'eval-metro-bundle'
  )(scriptContents);

  return function loadPageAsync(url: URL) {
    const fetchData = getDataLoader(url);

    return {
      fetchData,
      scriptContents,
      renderAsync: () => getStaticContentAsync(url),
    };
  };
}
