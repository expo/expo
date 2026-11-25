import type { ExpoConfig } from '@expo/config';
import { getConfig, getNameFromConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';

import { TEMPLATES } from '../../customize/templates';
import { appendLinkToHtml, appendScriptsToHtml } from '../../export/html';
import { getPublicFolderPath } from '../../export/publicFolder';

/**
 * Create a static HTML for SPA styled websites.
 * This method attempts to reuse the same patterns as `@expo/webpack-config`.
 */
export async function createTemplateHtmlFromExpoConfigAsync(
  projectRoot: string,
  {
    scripts,
    cssLinks,
    extraHead,
    exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp,
  }: {
    scripts: string[];
    cssLinks?: string[];
    /** Pre-rendered HTML to inject before `</head>`. Used for caller-owned head assets like favicons. */
    extraHead?: string;
    exp?: ExpoConfig;
  }
) {
  return createTemplateHtmlAsync(projectRoot, {
    langIsoCode: exp.web?.lang ?? 'en',
    scripts,
    cssLinks,
    extraHead,
    title: getNameFromConfig(exp).webName ?? 'Expo App',
    description: exp.web?.description,
    themeColor: exp.web?.themeColor,
  });
}

function getFileFromLocalPublicFolder(
  projectRoot: string,
  { filePath }: { filePath: string }
): string | null {
  const localFilePath = path.resolve(getPublicFolderPath(projectRoot), filePath);
  if (!fs.existsSync(localFilePath)) {
    return null;
  }
  return localFilePath;
}

/** Attempt to read the `index.html` from the local project before falling back on the template `index.html`. */
async function getTemplateIndexHtmlAsync(projectRoot: string): Promise<string> {
  let filePath = getFileFromLocalPublicFolder(projectRoot, {
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
    scripts,
    cssLinks,
    extraHead,
    description,
    langIsoCode,
    title,
    themeColor,
  }: {
    scripts: string[];
    cssLinks?: string[];
    /** Pre-rendered HTML to inject before `</head>`. */
    extraHead?: string;
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

  contents = appendScriptsToHtml(contents, scripts);

  if (cssLinks) {
    contents = appendLinkToHtml(
      contents,
      cssLinks
        .map((href) => [
          // NOTE: We probably don't have to preload the CSS files for SPA-styled websites.
          {
            as: 'style',
            rel: 'preload',
            href,
          },
          {
            rel: 'stylesheet',
            href,
          },
        ])
        .flat()
    );
  }

  if (themeColor) {
    contents = addMeta(contents, `name="theme-color" content="${themeColor}"`);
  }

  if (description) {
    contents = addMeta(contents, `name="description" content="${description}"`);
  }

  if (extraHead) {
    contents = contents.replace('</head>', `${extraHead}</head>`);
  }

  return contents;
}

/** Add a `<meta />` tag to the `<head />` element. */
function addMeta(contents: string, meta: string): string {
  return contents.replace('</head>', `<meta ${meta}>\n</head>`);
}
