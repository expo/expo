import { ExpoConfig } from '@expo/config-types';
import JsonFile, { JSONObject } from '@expo/json-file';
import path from 'path';

import { addWarningForPlatform } from './warnings';

export type LocaleJson = Record<string, string> & {
  ios?: Record<string, string>;
  android?: Record<string, string>;
};
export type ResolvedLocalesJson = Record<string, LocaleJson>;
export type ExpoConfigLocales = NonNullable<ExpoConfig['locales']>;

export async function getResolvedLocalesAsync(
  projectRoot: string,
  input: ExpoConfigLocales,
  forPlatform: 'ios' | 'android'
): Promise<ResolvedLocalesJson> {
  const locales: ResolvedLocalesJson = {};
  for (const [lang, localeJsonPath] of Object.entries(input)) {
    let locale: JSONObject | null = null;
    if (typeof localeJsonPath === 'string') {
      try {
        locale = await JsonFile.readAsync(path.join(projectRoot, localeJsonPath));
      } catch {
        // Add a warning when a json file cannot be parsed.
        addWarningForPlatform(
          forPlatform,
          `locales.${lang}`,
          `Failed to parse JSON of locale file for language: ${lang}`,
          'https://docs.expo.dev/guides/localization/#translating-app-metadata'
        );
      }
    } else {
      // In the off chance that someone defined the locales json in the config, pass it directly to the object.
      // We do this to make the types more elegant.
      locale = localeJsonPath;
    }
    if (locale) {
      const { android, ios, ...rest } = { android: {}, ios: {}, ...locale };
      if (forPlatform === 'ios') {
        locales[lang] = { ...rest, ...ios };
      } else {
        locales[lang] = { ...rest, ...android };
      }
    }
  }

  return locales;
}
