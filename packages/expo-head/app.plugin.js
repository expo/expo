const { withInfoPlist } = require("@expo/config-plugins");

function withHead(config) {
  return withInfoPlist(config, (config) => {
    // Enable "Search In" for iOS Spotlight.
    config.modResults.CoreSpotlightContinuation = true;

    return config;
  });
}

module.exports = withHead;
