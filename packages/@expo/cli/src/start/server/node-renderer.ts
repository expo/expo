import fs from 'fs';
import path from 'path';
import requireString from 'require-from-string';

import { bundleAsync } from '../../export/fork-bundleAsync';
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

export async function getServerRenderer(projectRoot: string): Promise<(location: URL) => string> {
  const tempFilePath = await createNodeEntryAsync(projectRoot);

  // TODO: Use running dev server instead, if available.
  const obj = await profile(bundleAsync, 'metro-bundle')(
    projectRoot,
    {},
    {
      quiet: true,
    },
    [
      {
        minify: false,
        entryPoint: tempFilePath,
        platform: 'web',
        dev: false,
        runModule: false,
      },
    ]
  );

  const processedCode = obj[0].code;

  //   console.log('processedCode', obj[0]);
  await storeDebugBundleResults(projectRoot, processedCode);

  const res = profile(
    requireString,
    'eval-metro-bundle'
  )(`module.exports = (() => { ${processedCode}; return __r(0); })() `);

  return res.serverRenderUrl;
}
