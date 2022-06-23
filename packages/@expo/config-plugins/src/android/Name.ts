import { ExpoConfig } from '@expo/config-types';

import { ConfigPlugin } from '../Plugin.types';
import { createStringsXmlPlugin, withSettingsGradle } from '../plugins/android-plugins';
import { addWarningAndroid } from '../utils/warnings';
import { buildResourceItem, ResourceXML } from './Resources';
import { removeStringItem, setStringItem } from './Strings';

/**
 * Sanitize a name, this should be used for files and gradle names.
 * - `[/, \, :, <, >, ", ?, *, |]` are not allowed
 * https://docs.gradle.org/4.2/release-notes.html#path-separator-characters-in-names-are-deprecated
 *
 * @param name
 */
export function sanitizeNameForGradle(name: string): string {
  // Remove escape characters which are valid in XML names but not in gradle.
  name = name.replace(/[\n\r\t]/g, '');

  // Gradle disallows these:
  // The project name 'My-Special 😃 Co/ol_Project' must not contain any of the following characters: [/, \, :, <, >, ", ?, *, |]. Set the 'rootProject.name' or adjust the 'include' statement (see https://docs.gradle.org/6.2/dsl/org.gradle.api.initialization.Settings.html#org.gradle.api.initialization.Settings:include(java.lang.String[]) for more details).
  return name.replace(/(\/|\\|:|<|>|"|\?|\*|\|)/g, '');
}

export const withName = createStringsXmlPlugin(applyNameFromConfig, 'withName');

export const withNameSettingsGradle: ConfigPlugin = config => {
  return withSettingsGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = applyNameSettingsGradle(config, config.modResults.contents);
    } else {
      addWarningAndroid(
        'name',
        `Cannot automatically configure settings.gradle if it's not groovy`
      );
    }
    return config;
  });
};

export function getName(config: Pick<ExpoConfig, 'name'>) {
  return typeof config.name === 'string' ? config.name : null;
}

function applyNameFromConfig(
  config: Pick<ExpoConfig, 'name'>,
  stringsJSON: ResourceXML
): ResourceXML {
  const name = getName(config);
  if (name) {
    return setStringItem([buildResourceItem({ name: 'app_name', value: name })], stringsJSON);
  }
  return removeStringItem('app_name', stringsJSON);
}

/**
 * Regex a name change -- fragile.
 *
 * @param config
 * @param settingsGradle
 */
export function applyNameSettingsGradle(config: Pick<ExpoConfig, 'name'>, settingsGradle: string) {
  const name = sanitizeNameForGradle(getName(config) ?? '');

  // Select rootProject.name = '***' and replace the contents between the quotes.
  return settingsGradle.replace(
    /rootProject.name\s?=\s?(["'])(?:(?=(\\?))\2.)*?\1/g,
    `rootProject.name = '${name.replace(/'/g, "\\'")}'`
  );
}
