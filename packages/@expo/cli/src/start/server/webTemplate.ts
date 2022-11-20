import fs from 'fs';
import path from 'path';
import requireString from 'require-from-string';

import { bundleAsync } from '../../export/fork-bundleAsync';
import { profile } from '../../utils/profile';

// Copy a local Node file into the project so we don't have to modify watchFolders.
async function createNodeEntryAsync(projectRoot: string) {
  const tempFileLocation = path.join(projectRoot, '.expo', 'web', 'render-routes.js');

  fs.promises.mkdir(path.dirname(tempFileLocation), { recursive: true });

  const templatePath = path.join(__dirname, 'render-routes.js');
  const template = fs.readFileSync(templatePath, 'utf8');
  // template = template.replace('[PATH_TO_COMPONENTS]', '../../app');

  fs.writeFileSync(tempFileLocation, template);

  return tempFileLocation;
}

async function requireBundledComponent(
  projectRoot: string,
  // TODO: Allow parsing just a single file for development mode.
  filePath: string,
  {
    scripts,
  }: {
    scripts: string[];
  }
): Promise<Record<string, string>> {
  const tempFilePath = await createNodeEntryAsync(projectRoot);

  const obj = await profile(bundleAsync, 'metro-bundle')(
    projectRoot,
    {},
    {
      quiet: true,
    },
    [
      {
        entryPoint: tempFilePath,
        platform: 'web',
        dev: false,
        runModule: false,
      },
    ]
  );

  const processedCode = obj[0].code;

  const res = profile(
    requireString,
    'eval-metro-bundle'
  )(`module.exports = (() => { ${processedCode}; return __r(0); })() `);

  return res.renderRoutes({ scripts });
}

/**
 * Create a static HTML for SPA styled websites.
 * This method attempts to reuse the same patterns as `@expo/webpack-config`.
 */
export async function createTemplateHtmlFromExpoConfigAsync(
  projectRoot: string,
  {
    scripts,
  }: {
    scripts: string[];
  }
) {
  const serverRendered = await requireBundledComponent(projectRoot, 'TODO', { scripts });
  return Object.entries(serverRendered).map<[string, string]>(([key, serverRendered]) => {
    return [key + '.html', serverRendered] as const;
  });
}
