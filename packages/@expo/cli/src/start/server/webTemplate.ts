import { ExpoConfig, getConfig, getNameFromConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';

import { TEMPLATES } from '../../customize/templates';
import { env } from '../../utils/env';

import requireString from 'require-from-string';
import { bundleAsync } from '../../export/fork-bundleAsync';
import {
  importReactDomServerFromProject,
  importReactNativeWebAppRegistryFromProject,
} from './metro/resolveFromProject';

function interopDefault(_module: any) {
  return _module.default || _module;
}

async function requireBundledComponent(projectRoot: string, filePath: string) {
  const obj = await bundleAsync(
    projectRoot,
    {},
    {
      quiet: true,
    },
    [
      {
        entryPoint: filePath,
        platform: 'web',
        dev: true,
        // shallow: true,
        runModule: false,
        // modulesOnly: true,
      },
    ]
  );

  console.log('obj', obj[0].code);

  const res = requireString(`module.exports = (() => { ${obj[0].code}; return __r(0); })() `);
  const Component = interopDefault(res);

  return Component;
}

function renderReactNativeWeb(projectRoot: string, name: string, Component: Function) {
  const ReactDOMServer = importReactDomServerFromProject(projectRoot);
  const AppRegistry = importReactNativeWebAppRegistryFromProject(projectRoot);

  // // register the app
  AppRegistry.registerComponent(name, () => Component);

  // prerender the app
  const { element, getStyleElement } = AppRegistry.getApplication(name, {});
  // first the element
  const markup = ReactDOMServer.renderToString(element);
  // then the styles
  const css = ReactDOMServer.renderToStaticMarkup(getStyleElement());

  console.log('markup', markup);
  console.log('css', css);

  return { css, markup };
}

async function serverRenderComponent(projectRoot: string, filePath: string) {
  const Component = await requireBundledComponent(projectRoot, filePath);
  return renderReactNativeWeb(projectRoot, filePath, Component);
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
  const serverRendered = await serverRenderComponent(
    projectRoot,
    path.resolve(projectRoot, 'App.tsx')
  );
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
    serverRendered: { css: string; markup: string };
    scripts: string[];
    description?: string;
    langIsoCode: string;
    title: string;
    themeColor?: string;
  }
): Promise<string> {
  // Resolve the best possible index.html template file.
  let contents = await getTemplateIndexHtmlAsync(projectRoot);

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
  return contents;
}

/** Add a `<meta />` tag to the `<head />` element. */
function addMeta(contents: string, meta: string): string {
  return contents.replace('</head>', `<meta ${meta}>\n</head>`);
}
