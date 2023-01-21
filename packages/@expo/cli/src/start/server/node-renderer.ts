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
  // template = template.replace('[PATH_TO_COMPONENTS]', '../../app');

  fs.writeFileSync(tempFileLocation, template);

  return tempFileLocation;
}

async function storeDebugBundleResults(projectRoot: string, results) {
  const tempFileLocation = path.join(projectRoot, '.expo', 'web', 'debug-ssr');

  fs.promises.mkdir(tempFileLocation, { recursive: true });
  const templatePath = path.join(tempFileLocation, 'index.js');
  fs.writeFileSync(templatePath, results);

  return tempFileLocation;
}

export async function getServerRenderer(
  projectRoot: string,
  devServerUrl: string
): Promise<(location: URL) => string> {
  await createNodeEntryAsync(projectRoot);

  const content = await fetch(
    `${devServerUrl}/.expo/web/render-root.bundle?platform=web&dev=false&minify=false&runModule=false&modulesOnly=false`
  ).then((res) => res.text());

  //   await storeDebugBundleResults(projectRoot, content);

  const res = profile(
    requireString,
    'eval-metro-bundle'
  )(`module.exports = (() => { ${content}\n; return __r(0); })() `);

  return res.serverRenderUrl;
}
