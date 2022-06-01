import { ExpoConfig, getConfig, getNameFromConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';

import { TEMPLATES } from '../../customize/templates';
import { env } from '../../utils/env';

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
) {
  const localFilePath = path.resolve(projectRoot, publicFolder, filePath);
  if (!fs.existsSync(localFilePath)) {
    return null;
  }
  return localFilePath;
}

/** Attempt to read the `index.html` from the local project before falling back on the template `index.html`. */
async function getTemplateIndexHtmlAsync(projectRoot: string) {
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

export async function createTemplateHtmlAsync(
  projectRoot: string,
  {
    scripts,
    description,
    langIsoCode,
    title,
    themeColor,
  }: {
    scripts: string[];
    description?: string;
    langIsoCode: string;
    title: string;
    themeColor?: string;
  }
) {
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

  return contents;
}

function addMeta(contents: string, meta: string) {
  return contents.replace('</head>', `<meta ${meta}>\n</head>`);
}
