const { createRunOncePlugin, withAppBuildGradle } = require('@expo/config-plugins');

// The placeholder scheme doesn't really matter, but sometimes the Android build fails without it being defined.
function setGradlePlaceholders(buildGradle, placeholder) {
  if (buildGradle.includes('appAuthRedirectScheme:')) {
    return buildGradle;
  }
  // There's a chance this could fail if another plugin defines `manifestPlaceholders`
  // but AFAIK only app-auth does this in the Expo ecosystem.
  return buildGradle.replace(
    /defaultConfig\s?{/,
    `defaultConfig {
        manifestPlaceholders = [appAuthRedirectScheme: '${placeholder}']`
  );
}

const withAppAuth = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { placeholder = '' } = {}
) => {
  return withAppBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setGradlePlaceholders(config.modResults.contents, placeholder);
    } else {
      throw new Error(
        "Cannot set manifest placeholders' appAuthRedirectScheme in the app gradle because the build.gradle is not groovy"
      );
    }
    return config;
  });
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withAppAuth, pkg.name, pkg.version);
