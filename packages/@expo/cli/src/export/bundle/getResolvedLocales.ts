import { ExpoConfig } from '@expo/config';
import JsonFile from '@expo/json-file';
import path from 'path';

import { CommandError } from '../../utils/errors';

type LocaleMap = { [lang: string]: any };

// Similar to how we resolve locales in `@expo/config-plugins`
export async function getResolvedLocalesAsync(
  projectRoot: string,
  exp: ExpoConfig
): Promise<LocaleMap> {
  const locales: LocaleMap = {};
  if (exp.locales) {
    for (const [lang, localeJsonPath] of Object.entries(exp.locales)) {
      if (typeof localeJsonPath === 'string') {
        try {
          locales[lang] = await JsonFile.readAsync(path.join(projectRoot, localeJsonPath));
        } catch (e: any) {
          throw new CommandError('EXPO_CONFIG', JSON.stringify(e));
        }
      } else {
        // In the off chance that someone defined the locales json in the config, pass it directly to the object.
        // We do this to make the types more elegant.
        locales[lang] = localeJsonPath;
      }
    }
  }
  return locales;
}
