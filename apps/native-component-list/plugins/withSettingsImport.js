const { withSettingsGradle } = require('@expo/config-plugins');

const withSettingsImport = (config, { packageName, packagePath }) => {
  return withSettingsGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      if (!config.modResults.contents.includes(`:${packageName}`)) {
        config.modResults.contents += `
include(":${packageName}")
project(":${packageName}").projectDir = new File("${packagePath}")`;
      }
    } else {
      throw new Error(`Cannot setup "${packageName}" because the settings.gradle is not groovy`);
    }
    return config;
  });
};

module.exports = withSettingsImport;
