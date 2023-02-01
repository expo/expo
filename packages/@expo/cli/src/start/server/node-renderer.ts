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

import { profile } from '../../utils/profile';

const INJECT_FILE_NAME = 'render';

// Copy a local Node file into the project so we don't have to modify watchFolders.
async function createNodeEntryAsync(projectRoot: string) {
  const tempFileLocation = path.join(projectRoot, '.expo', 'web', INJECT_FILE_NAME + '.js');

  await fs.promises.mkdir(path.dirname(tempFileLocation), { recursive: true });

  // NOTE: This is only needed for development, otherwise the file is already in the project.
  const templatePath = path.join(__dirname, INJECT_FILE_NAME + '.js');
  const template = fs.readFileSync(templatePath, 'utf8');

  fs.writeFileSync(tempFileLocation, template);

  return tempFileLocation;
}

function wrapBundle(str: string) {
  // Skip the metro runtime so debugging is a bit easier.
  // Replace the __r() call with an export statement.
  return str.replace(/^(__r\(.*\);)$/m, 'module.exports = $1');
}

export async function getStaticRenderFunctions(
  projectRoot: string,
  devServerUrl: string,
  { dev = false, minify = false }: { dev?: boolean; minify?: boolean } = {}
): Promise<any> {
  await createNodeEntryAsync(projectRoot);
  const content = await fetch(
    `${devServerUrl}/.expo/web/${INJECT_FILE_NAME}.bundle?platform=web&dev=${dev}&minify=${minify}`
  ).then((res) => res.text());
  return profile(requireString, 'eval-metro-bundle')(wrapBundle(content));
}
