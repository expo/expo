import type { ExpoConfig } from '@expo/config-types';
import path from 'path';

import type { ConfigPlugin } from '../Plugin.types';
import { withDangerousMod } from '../plugins/withDangerousMod';
import { writeXMLAsync } from '../utils/XML';
import type { LocaleJson } from '../utils/locales';
import { getResolvedLocalesAsync } from '../utils/locales';
import * as Paths from './Paths';

// Android looks up resources for these languages under their legacy ISO 639 codes.
// See `adjustLanguageTag` in `android.content.res.ResourcesImpl`.
const LEGACY_LANGUAGE_CODES: Record<string, string> = { he: 'iw', id: 'in', yi: 'ji' };

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

function getResourceQualifier(locale: string): string {
  const tag = locale.replace(
    /^[a-z]+/i,
    (language) => LEGACY_LANGUAGE_CODES[language.toLowerCase()] ?? language
  );
  return `b+${tag.replaceAll('-', '+')}`;
}

export async function setLocalesAsync(
  config: Pick<ExpoConfig, 'locales'>,
  { projectRoot }: { projectRoot: string }
): Promise<unknown> {
  const locales = getLocales(config);
  if (!locales) {
    return config;
  }
  const { localesMap } = await getResolvedLocalesAsync(projectRoot, locales, 'android');
  for (const [lang, localizationObj] of Object.entries(localesMap)) {
    const stringsFilePath = path.join(
      await Paths.getResourceFolderAsync(projectRoot),
      `values-${getResourceQualifier(lang)}`,
      'strings.xml'
    );
    await writeXMLAsync({
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
