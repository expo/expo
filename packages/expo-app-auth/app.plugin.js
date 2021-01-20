const pkg = require('./package.json');
const {
  createRunOncePlugin,
  AndroidConfig,
  withAppBuildGradle,
  withInfoPlist,
} = require('@expo/config-plugins');

// The placeholder scheme doesn't really matter, but sometimes the Android build fails without it being defined.
function setGradlePlaceholders(buildGradle, placeholder) {
  const pattern = /appAuthRedirectScheme:\s?(["'])(?:(?=(\\?))\2.)*?\1/g;
  const replacement = `appAuthRedirectScheme: '${placeholder}'`;
  if (buildGradle.match(pattern)) {
    // Select kotlinVersion = '***' and replace the contents between the quotes.
    return buildGradle.replace(pattern, replacement);
  }

  // There's a chance this could fail if another plugin defines `manifestPlaceholders`
  // but AFAIK only app-auth does this in the Expo ecosystem.
  return buildGradle.replace(
    /defaultConfig\s?{/,
    `defaultConfig {
        manifestPlaceholders = [${replacement}]`
  );
}

const withAppAuth = (
  config,
  { placeholder = AndroidConfig.Scheme.getScheme(config)[0] || 'dev.expo.app' } = {}
) => {
  config = withAppBuildGradle(config, config => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setGradlePlaceholders(config.modResults.contents, placeholder);
    } else {
      throw new Error(
        "Cannot set manifest placeholders' appAuthRedirectScheme in the app gradle because the build.gradle is not groovy"
      );
    }
    return config;
  });
  config = withInfoPlist(config, config => {
    const infoPlist = config.modResults;
    const existingUrlTypes = infoPlist.CFBundleURLTypes;
    infoPlist.CFBundleURLTypes = [
      ...(existingUrlTypes ?? []),
      {
        CFBundleURLName: 'OAuthRedirect',
        CFBundleURLSchemes: [infoPlist.CFBundleIdentifier],
      },
    ];

    return config;
  });
  return config;
};

module.exports = createRunOncePlugin(withAppAuth, pkg.name, pkg.version);
