import { ExpoConfig } from '@expo/config-types';
import path from 'path';

import { AndroidConfig, withDangerousMod } from '..';
import { ConfigPlugin } from '../Plugin.types';
import { writeXMLAsync } from '../utils/XML';
import { getResolvedLocalesAsync, LocaleJson } from '../utils/locales';

export const withLocales: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      config.modResults = await setLocalesAsync(config, {
        projectRoot: config.modRequest.projectRoot,
      });
      return config;
    },
  ]);
};

export function getLocales(
  config: Pick<ExpoConfig, 'locales'>
): Record<string, string | LocaleJson> | null {
  return config.locales ?? null;
}

export async function setLocalesAsync(
  config: Pick<ExpoConfig, 'locales'>,
  { projectRoot }: { projectRoot: string }
): Promise<unknown> {
  const locales = getLocales(config);
  if (!locales) {
    return config;
  }
  const localesMap = await getResolvedLocalesAsync(projectRoot, locales, 'android');
  for (const [lang, localizationObj] of Object.entries(localesMap)) {
    const stringsFilePath = path.join(
      await AndroidConfig.Paths.getResourceFolderAsync(projectRoot),
      `values-b+${lang.replaceAll('-', '+')}`,
      'strings.xml'
    );
    writeXMLAsync({
      path: stringsFilePath,
      xml: {
        resources: Object.entries(localizationObj).map(([k, v]) => ({
          string: {
            $: {
              name: k,
            },
            _: `"${v}"`,
          },
        })),
      },
    });
  }

  return config;
}
