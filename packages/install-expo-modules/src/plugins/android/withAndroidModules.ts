import { ConfigPlugin, withPlugins, withSettingsGradle } from '@expo/config-plugins';

import { withAndroidModulesMainActivity } from './withAndroidModulesMainActivity';
import { withAndroidModulesMainApplication } from './withAndroidModulesMainApplication';

export const withAndroidModules: ConfigPlugin = config => {
  return withPlugins(config, [
    withAndroidModulesMainApplication,
    withAndroidModulesMainActivity,
    withAndroidModulesSettingGradle,
  ]);
};

const withAndroidModulesSettingGradle: ConfigPlugin = config => {
  return withSettingsGradle(config, config => {
    if (config.modResults.contents.match('useExpoModules()')) {
      return config;
    }

    const isGroovy = config.modResults.language === 'groovy';
    const addCodeBlock = isGroovy
      ? [
          'apply from: new File(["node", "--print", "require.resolve(\'expo/package.json\')"].execute(null, rootDir).text.trim(), "../scripts/autolinking.gradle")',
          'useExpoModules()',
        ]
      : [
          'val pathExpoPackageJson = org.codehaus.groovy.runtime.ProcessGroovyMethods.getText(org.codehaus.groovy.runtime.ProcessGroovyMethods.execute("node --print require.resolve(\'expo/package.json\')", null, rootDir))',
          'apply(from = File(pathExpoPackageJson.trim(), "../scripts/autolinking.gradle"))',
          'val useExpoModules = extra["useExpoModules"] as groovy.lang.Closure<Any>',
          'useExpoModules()',
        ];

    config.modResults.contents = config.modResults.contents + `\n${addCodeBlock.join('\n')}`;
    return config;
  });
};
