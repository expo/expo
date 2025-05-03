import { ConfigPlugin, withSettingsGradle } from '@expo/config-plugins';
import { appendContentsInsideGradlePluginBlock } from '@expo/config-plugins/build/android/codeMod';
import semver from 'semver';

export const withAndroidModulesSettingGradle: ConfigPlugin = (config) => {
  return withSettingsGradle(config, (config) => {
    config.modResults.contents = updateAndroidSettingsGradle({
      contents: config.modResults.contents,
      isGroovy: config.modResults.language === 'groovy',
      sdkVersion: config.sdkVersion,
    });
    return config;
  });
};

export function updateAndroidSettingsGradle({
  contents,
  isGroovy,
  sdkVersion,
}: {
  contents: string;
  isGroovy: boolean;
  sdkVersion: string | undefined;
}) {
  if (sdkVersion && semver.lt(sdkVersion, '53.0.0')) {
    return updateAndroidSettingsGradleSdk52({ contents, isGroovy, sdkVersion });
  }

  let newContents = contents;
  if (!newContents.match(/expo-modules-autolinking\/package.json/)) {
    const addCodeBlock = [
      '', // new line
      isGroovy ? '  def expoPluginsPath = new File(' : '  val expoPluginsPath = File(',
      '    providers.exec {',
      '      workingDir(rootDir)',
      '      commandLine("node", "--print", "require.resolve(\'expo-modules-autolinking/package.json\', { paths: [require.resolve(\'expo/package.json\')] })")',
      '    }.standardOutput.asText.get().trim(),',
      '    "../android/expo-gradle-plugin"',
      '  ).absolutePath',
      '  includeBuild(expoPluginsPath)',
      '', // new line
    ];
    newContents = appendContentsInsideGradlePluginBlock(
      newContents,
      'pluginManagement',
      addCodeBlock.join('\n')
    );
  }

  if (!newContents.match(/id\("expo-autolinking-settings"\)/)) {
    newContents = appendContentsInsideGradlePluginBlock(
      newContents,
      'plugins',
      '\nid("expo-autolinking-settings")\n'
    );
  }

  const autolinkingRegExp = /(ex\.autolinkLibrariesFromCommand\(\))/;
  newContents = newContents.replace(
    autolinkingRegExp,
    `ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)`
  );

  if (!newContents.match(/expoAutolinking\.useExpoModules\(\)/)) {
    newContents += `expoAutolinking.useExpoModules()\n`;
  }
  if (!newContents.match(/expoAutolinking\.useExpoVersionCatalog\(\)/)) {
    newContents += `expoAutolinking.useExpoVersionCatalog()\n`;
  }
  if (!newContents.match(/includeBuild\(expoAutolinking\.reactNativeGradlePlugin\)/)) {
    newContents += `includeBuild(expoAutolinking.reactNativeGradlePlugin)\n`;
  }

  return newContents;
}

function updateAndroidSettingsGradleSdk52({
  contents,
  isGroovy,
  sdkVersion,
}: {
  contents: string;
  isGroovy: boolean;
  sdkVersion: string | undefined;
}) {
  let newContents = contents;

  if (!newContents.match('useExpoModules()')) {
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
    newContents = newContents + `\n${addCodeBlock.join('\n')}`;
  }

  // `ex.autolinkLibrariesFromCommand()` from expo-modules-autolinking
  if (sdkVersion && semver.gte(sdkVersion, '52.0.0')) {
    const autolinkingRegExp = /(\{\s+ex\s+->)(\s+ex\.autolinkLibrariesFromCommand\(\))\s+/;
    const newBlock = `
  def command = [
    'node',
    '--no-warnings',
    '--eval',
    'require(require.resolve(\\'expo-modules-autolinking\\', { paths: [require.resolve(\\'expo/package.json\\')] }))(process.argv.slice(1))',
    'react-native-config',
    '--json',
    '--platform',
    'android'
  ].toList()
  ex.autolinkLibrariesFromCommand(command)
`;
    newContents = newContents.replace(autolinkingRegExp, `$1${newBlock}`);
  }

  return newContents;
}
