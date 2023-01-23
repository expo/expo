import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import requireString from 'require-from-string';

import { profile } from '../../utils/profile';

// Copy a local Node file into the project so we don't have to modify watchFolders.
async function createNodeEntryAsync(projectRoot: string) {
  const tempFileLocation = path.join(projectRoot, '.expo', 'web', 'render-root.js');

  fs.promises.mkdir(path.dirname(tempFileLocation), { recursive: true });

  const templatePath = path.join(__dirname, 'render-root.js');
  const template = fs.readFileSync(templatePath, 'utf8');

  fs.writeFileSync(tempFileLocation, template);

  return tempFileLocation;
}

function wrapBundle(str: string) {
  // Skip the metro runtime so debugging is a bit easier.
  // Replace the __r() call with an export statement.
  return str.replace(/^(__r\(.*\);)$/m, 'module.exports = $1');
}

export async function getMiddlewareContent(
  devServerUrl: string,
  pathname: string,
  { dev = false, minify = false }: { dev?: boolean; minify?: boolean } = {}
): Promise<string> {
  const content = await fetch(
    `${devServerUrl}/${pathname}.bundle?platform=web&dev=${dev}&minify=${minify}`
  ).then((res) => res.text());
  return wrapBundle(content);
}

export async function getMiddleware(devServerUrl: string, pathname: string): Promise<any> {
  return profile(
    requireString,
    'eval-metro-bundle'
  )(await getMiddlewareContent(devServerUrl, pathname));
}

export async function getServerFunctions(
  projectRoot: string,
  devServerUrl: string,
  { dev = false, minify = false }: { dev?: boolean; minify?: boolean } = {}
): Promise<any> {
  await createNodeEntryAsync(projectRoot);
  const content = await fetch(
    `${devServerUrl}/.expo/web/render-root.bundle?platform=web&dev=${dev}&minify=${minify}`
  ).then((res) => res.text());
  return profile(requireString, 'eval-metro-bundle')(wrapBundle(content));
}

export async function getServerRenderer(
  projectRoot: string,
  devServerUrl: string
): Promise<(location: URL) => string> {
  const res = await getServerFunctions(projectRoot, devServerUrl);
  return res.serverRenderUrl;
}
