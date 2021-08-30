const { withInfoPlist } = require('@expo/config-plugins');

const withSplashScreen = config => {
  return withInfoPlist(config, async config => {
    const plist = config.modResults;
    plist['UILaunchStoryboardName'] = 'SplashScreen';

    return config;
  });
};

module.exports = withSplashScreen;
