import { ExpoConfig } from '@expo/config-types';
import JsonFile, { JSONObject } from '@expo/json-file';
import path from 'path';

import { addWarningForPlatform } from './warnings';

export type LocaleJson = Record<string, string> & {
  ios?: Record<string, string>;
  android?: Record<string, string>;
};
export type ResolvediOSLocalesJson = {
  locales: Record<string, LocaleJson>;
  localizableStrings: Record<string, LocaleJson>;
};
export type IOSConfig = {
  localizableStrings?: Record<string, string>;
  [key: string]: any;
};
export type ResolvedLocalesJson = Record<string, LocaleJson>;
export type ExpoConfigLocales = NonNullable<ExpoConfig['locales']>;

export async function getResolvedLocalesAsync(
  projectRoot: string,
  input: ExpoConfigLocales,
  forPlatform: 'ios' | 'android'
): Promise<ResolvedLocalesJson | ResolvediOSLocalesJson> {
  const locales: ResolvedLocalesJson = {};
  const localizableStrings: ResolvedLocalesJson = {};
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
      const { android, ios, ...rest } = { android: {}, ios: {} as IOSConfig, ...locale };
      if (forPlatform === 'ios') {
        const { localizableStrings: localStrings, ...iosRest } = ios;
        if (localStrings) {
          localizableStrings[lang] = localStrings;
        }
        locales[lang] = { ...rest, ...iosRest };
      } else {
        locales[lang] = { ...rest, ...android };
      }
    }
  }

  if (forPlatform === 'ios') {
    return { locales, localizableStrings };
  } else {
    return locales;
  }
}
