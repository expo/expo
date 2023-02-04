/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fetch from 'node-fetch';
import path from 'path';
import requireString from 'require-from-string';
import resolveFrom from 'resolve-from';

import { profile } from '../../utils/profile';
const debug = require('debug')('expo:start:server:node-renderer') as typeof console.log;

function wrapBundle(str: string) {
  // Skip the metro runtime so debugging is a bit easier.
  // Replace the __r() call with an export statement.
  return str.replace(/^(__r\(.*\);)$/m, 'module.exports = $1');
}

// TODO(EvanBacon): Group all the code together and version.
const getRenderModuleId = (projectRoot: string): string => {
  const moduleId = resolveFrom.silent(projectRoot, 'expo-router/node/render.js');
  if (!moduleId) {
    throw new Error(
      `A version of expo-router with Node.js support is not installed in the project.`
    );
  }
  // remove extension:
  return path.relative(projectRoot, moduleId).replace(/\.js$/, '');
};

export async function getStaticRenderFunctions(
  projectRoot: string,
  devServerUrl: string,
  {
    dev = false,
    minify = false,
  }: {
    // Ensure the style format is `css-xxxx` (prod) instead of `css-view-xxxx` (dev)
    dev?: boolean;
    minify?: boolean;
  } = {}
): Promise<any> {
  const moduleId = getRenderModuleId(projectRoot);
  debug('Loading render functions from:', moduleId);
  if (moduleId.startsWith('..')) {
    throw new Error(
      `expo-router/node/render.js is not in the project root. This is not supported.`
    );
  }
  // TODO: Error handling
  const content = await fetch(
    `${devServerUrl}/${moduleId}.bundle?platform=web&dev=${dev}&minify=${minify}`
    // `${devServerUrl}/${moduleId}.bundle?platform=web&dev=${dev}&minify=${minify}`
  ).then((res) => res.text());
  return profile(requireString, 'eval-metro-bundle')(wrapBundle(content));
}
