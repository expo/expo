const { withInfoPlist } = require('@expo/config-plugins');

const withEmptyUriScheme = config => {
  return withInfoPlist(config, async config => {
    // TODO - remove when we can run expo run:ios/android without dev-client from CLI
    // e.g expo run:ios --no-dev-client or something like that
    const plist = config.modResults;
    plist['CFBundleURLTypes'] = [];

    return config;
  });
};

module.exports = withEmptyUriScheme;
