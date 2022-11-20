import { ExpoConfig, getConfig, getNameFromConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';
import requireString from 'require-from-string';

import { TEMPLATES } from '../../customize/templates';
import { bundleAsync } from '../../export/fork-bundleAsync';
import { env } from '../../utils/env';

async function createNodeEntryAsync(projectRoot: string) {
  const tempFileLocation = path.join(projectRoot, '.expo', 'web', 'render-routes.js');
  console.log('at: ', tempFileLocation);

  fs.promises.mkdir(path.dirname(tempFileLocation), { recursive: true });

  const templatePath = path.join(__dirname, 'render-routes.js');
  let template = fs.readFileSync(templatePath, 'utf8');
  template = template.replace('[PATH_TO_COMPONENTS]', '../../app');

  console.log('template:', template);
  fs.writeFileSync(tempFileLocation, template);

  return tempFileLocation;
}

async function requireBundledComponent(
  projectRoot: string,
  // TODO: Allow parsing just a single file for development mode.
  filePath: string
): Promise<Record<string, { markup: string; css: string }>> {
  const tempFilePath = await createNodeEntryAsync(projectRoot);

  const obj = await bundleAsync(
    projectRoot,
    {},
    {
      quiet: true,
    },
    [
      {
        entryPoint: tempFilePath,
        platform: 'web',
        dev: true,
        // shallow: true,
        runModule: false,
        // modulesOnly: true,
      },
    ]
  );

  const processedCode = obj[0].code; //.replaceAll('mockRequire', 'require');
  // console.log('obj', obj[0].code);

  const res = requireString(`module.exports = (() => { ${processedCode}; return __r(0); })() `);
  console.log(res);

  const rendered = res.renderRoutes();
  console.log('RENDERED:', rendered);
  return rendered;
}

/**
 * Create a static HTML for SPA styled websites.
 * This method attempts to reuse the same patterns as `@expo/webpack-config`.
 */
export async function createTemplateHtmlFromExpoConfigAsync(
  projectRoot: string,
  {
    scripts,
    exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp,
  }: {
    scripts: string[];
    exp?: ExpoConfig;
  }
) {
  const serverRendered = await requireBundledComponent(projectRoot, 'TODO');

  return createTemplateHtmlAsync(projectRoot, {
    serverRendered,
    langIsoCode: exp.web?.lang ?? 'en',
    scripts,
    title: getNameFromConfig(exp).webName ?? 'Expo App',
    description: exp.web?.description,
    themeColor: exp.web?.themeColor,
  });
}

function getFileFromLocalPublicFolder(
  projectRoot: string,
  { publicFolder, filePath }: { publicFolder: string; filePath: string }
): string | null {
  const localFilePath = path.resolve(projectRoot, publicFolder, filePath);
  if (!fs.existsSync(localFilePath)) {
    return null;
  }
  return localFilePath;
}

/** Attempt to read the `index.html` from the local project before falling back on the template `index.html`. */
async function getTemplateIndexHtmlAsync(projectRoot: string): Promise<string> {
  let filePath = getFileFromLocalPublicFolder(projectRoot, {
    // TODO: Maybe use the app.json override.
    publicFolder: env.EXPO_PUBLIC_FOLDER,
    filePath: 'index.html',
  });
  if (!filePath) {
    filePath = TEMPLATES.find((value) => value.id === 'index.html')!.file(projectRoot);
  }
  return fs.promises.readFile(filePath, 'utf8');
}

/** Return an `index.html` string with template values added. */
export async function createTemplateHtmlAsync(
  projectRoot: string,
  {
    serverRendered,
    scripts,
    description,
    langIsoCode,
    title,
    themeColor,
  }: {
    serverRendered: Record<string, { css: string; markup: string }>;
    scripts: string[];
    description?: string;
    langIsoCode: string;
    title: string;
    themeColor?: string;
  }
): Promise<[string, string][]> {
  // Resolve the best possible index.html template file.
  const rootContents = await getTemplateIndexHtmlAsync(projectRoot);

  return Object.entries(serverRendered).map<[string, string]>(([key, serverRendered]) => {
    let contents = rootContents;

    contents = contents.replace('%LANG_ISO_CODE%', langIsoCode);
    contents = contents.replace('%WEB_TITLE%', title);
    contents = contents.replace(
      '</body>',
      scripts.map((url) => `<script src="${url}"></script>`).join('') + '</body>'
    );

    if (themeColor) {
      contents = addMeta(contents, `name="theme-color" content="${themeColor}"`);
    }

    if (description) {
      contents = addMeta(contents, `name="description" content="${description}"`);
    }

    contents = contents.replace('<div id="root">', `<div id="root">${serverRendered.markup}`);
    contents = contents.replace('</head>', serverRendered.css + '</head>');
    return [key + '.html', contents] as const;
  });
}

/** Add a `<meta />` tag to the `<head />` element. */
function addMeta(contents: string, meta: string): string {
  return contents.replace('</head>', `<meta ${meta}>\n</head>`);
}
