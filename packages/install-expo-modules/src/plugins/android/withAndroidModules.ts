import { ConfigPlugin, withPlugins } from '@expo/config-plugins';

import { withAndroidModulesMainActivity } from './withAndroidModulesMainActivity';
import { withAndroidModulesMainApplication } from './withAndroidModulesMainApplication';
import { withAndroidModulesSettingGradle } from './withAndroidSettingsGradle';

export const withAndroidModules: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withAndroidModulesMainApplication,
    withAndroidModulesMainActivity,
    withAndroidModulesSettingGradle,
  ]);
};
