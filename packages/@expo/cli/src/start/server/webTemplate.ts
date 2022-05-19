import { ExpoConfig, getConfig, getNameFromConfig } from '@expo/config';
import fs from 'fs';

import { TEMPLATES } from '../../customize/templates';

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
  const indexHtmlFilePath = TEMPLATES.find((value) => value.id === 'index.html')!.file(projectRoot);

  let contents = await fs.promises.readFile(indexHtmlFilePath, 'utf8');

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
