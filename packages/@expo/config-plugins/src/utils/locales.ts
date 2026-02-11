import { ExpoConfig } from '@expo/config-types';
import JsonFile, { JSONObject } from '@expo/json-file';
import path from 'path';

import { addWarningForPlatform } from './warnings';

/**
 * on iOS only, we support a special case where
 * StringsMap contains a 'Localizable.strings'?: StringsMap; entry
 * Values written into `Localizable.strings` for iOS.
 */
export type StringsMap = Record<string, string>;

export type LocaleJson = Record<string, string> & {
  ios?: StringsMap;
  android?: StringsMap;
};

export type ExpoConfigLocales = NonNullable<ExpoConfig['locales']>;
export type ResolvedLocalesJson = Record<string, LocaleJson>;

export async function getResolvedLocalesAsync(
  projectRoot: string,
  input: ExpoConfigLocales,
  forPlatform: 'ios' | 'android'
): Promise<{ localesMap: ResolvedLocalesJson; localizableStringsIOS?: ResolvedLocalesJson }> {
  const locales: ResolvedLocalesJson = {};
  const localizableStringsIOS: ResolvedLocalesJson = {};
  for (const [lang, localeJsonPath] of Object.entries(input)) {
    const locale = await getLocales(projectRoot, localeJsonPath, forPlatform, lang);
    if (locale) {
      const { android, ios, ...rest } = {
        android: {},
        ios: {},
        ...locale,
      };
      if (forPlatform === 'ios') {
        const { localizableStringsEntry, otherEntries } = extractIosLocalizableStrings({
          ios,
          lang,
        });
        if (localizableStringsEntry) {
          localizableStringsIOS[lang] = localizableStringsEntry;
        }
        locales[lang] = { ...rest, ...otherEntries };
      } else {
        locales[lang] = { ...rest, ...android };
      }
    }
  }

  return { localesMap: locales, localizableStringsIOS };
}

async function getLocales(
  projectRoot: string,
  localeJsonPath: string | JSONObject,
  forPlatform: 'ios' | 'android',
  lang: string
): Promise<JSONObject | null> {
  if (typeof localeJsonPath === 'string') {
    try {
      return await JsonFile.readAsync(path.join(projectRoot, localeJsonPath));
    } catch {
      // Add a warning when a json file cannot be parsed.
      addWarningForPlatform(
        forPlatform,
        `locales.${lang}`,
        `Failed to parse JSON of locale file for language: ${lang}`,
        'https://docs.expo.dev/guides/localization/#translating-app-metadata'
      );
      return null;
    }
  }

  // In the off chance that someone defined the locales json in the config, pass it directly to the object.
  // We do this to make the types more elegant.
  return localeJsonPath;
}

function extractIosLocalizableStrings({ ios, lang }: { ios: StringsMap; lang: string }): {
  localizableStringsEntry?: StringsMap;
  otherEntries: StringsMap;
} {
  const LOCALIZABLE_STR_ENTRY = 'Localizable.strings';
  if (!(LOCALIZABLE_STR_ENTRY in ios)) {
    return { localizableStringsEntry: undefined, otherEntries: ios };
  }

  const { [LOCALIZABLE_STR_ENTRY]: localizableStringsEntry, ...otherEntries } = ios;

  if (!localizableStringsEntry) {
    return { localizableStringsEntry: undefined, otherEntries };
  }

  if (!isStringsMap(localizableStringsEntry)) {
    addWarningForPlatform(
      'ios',
      `locales.${lang}.ios['${LOCALIZABLE_STR_ENTRY}']`,
      'Expected a JSON object mapping string keys to string values',
      'https://docs.expo.dev/guides/localization/#translating-app-metadata'
    );
    return { localizableStringsEntry: undefined, otherEntries };
  }

  return { localizableStringsEntry, otherEntries };
}

function isStringsMap(value: unknown): value is StringsMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((item) => typeof item === 'string');
}
