import { ExpoConfig, getConfig, getNameFromConfig, Platform } from '@expo/config';
import fs from 'fs';
import path from 'path';

import { TEMPLATES } from '../../customize/templates';
import { env } from '../../utils/env';

type PlatformScripts = Partial<Record<Platform, string[]>>;

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
    scripts: PlatformScripts;
    exp?: ExpoConfig;
  }
) {
  return createTemplateHtmlAsync(projectRoot, {
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
    scripts,
    description,
    langIsoCode,
    title,
    themeColor,
  }: {
    scripts: PlatformScripts;
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

  const scriptTags: string[] = [];

  Object.entries(scripts).forEach(([platform, scripts]) => {
    if (platform === 'web') {
      scripts.forEach((script) => {
        scriptTags.push(`<script data-platform="${platform}" src="${script}"></script>`);
      });
    } else {
      scripts.forEach((script) => {
        scriptTags.push(
          // NOTE(EvanBacon): type="application/expo+javascript" forces the web browser to skip
          // loading the script. Native code loading libraries can look for and handle these scripts.
          `<script data-platform="${platform}" src="${script}" type="application/expo+javascript"></script>`
        );
      });
    }
  });

  if (scriptTags.length) {
    contents = contents.replace('</body>', scriptTags.join('\n') + '</body>');
  }

  if (themeColor) {
    contents = addMeta(contents, `name="theme-color" content="${themeColor}"`);
  }

  if (description) {
    contents = addMeta(contents, `name="description" content="${description}"`);
  }

  return contents;
}

/** Add a `<meta />` tag to the `<head />` element. */
function addMeta(contents: string, meta: string): string {
  return contents.replace('</head>', `<meta ${meta}>\n</head>`);
}
