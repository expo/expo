import { ExpoConfig } from '@expo/config';
import JsonFile, { JSONObject } from '@expo/json-file';
import path from 'path';

import { CommandError } from '../utils/errors';

export type LocaleMap = Record<string, JSONObject>;

// Similar to how we resolve locales in `@expo/config-plugins`
export async function getResolvedLocalesAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'locales'>
): Promise<LocaleMap> {
  if (!exp.locales) {
    return {};
  }

  const locales: LocaleMap = {};
  for (const [lang, localeJsonPath] of Object.entries(exp.locales)) {
    if (typeof localeJsonPath === 'string') {
      try {
        locales[lang] = await JsonFile.readAsync(path.join(projectRoot, localeJsonPath));
      } catch (error: any) {
        throw new CommandError('EXPO_CONFIG', JSON.stringify(error));
      }
    } else {
      // In the off chance that someone defined the locales json in the config, pass it directly to the object.
      // We do this to make the types more elegant.
      locales[lang] = localeJsonPath;
    }
  }
  return locales;
}
