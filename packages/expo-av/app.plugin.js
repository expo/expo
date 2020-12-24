const { createRunOncePlugin, withPlugins, AndroidConfig, IOSConfig } = require('@expo/config-plugins');

const withAV = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { microphonePermission = 'Allow $(PRODUCT_NAME) to access your microphone' } = {}
) => {
  return withPlugins(config, [
    [
      IOSConfig.Permissions.withPermissions,
      {
        NSMicrophoneUsageDescription: microphonePermission || null,
      },
    ],
    [
      AndroidConfig.Permissions.withPermissions,
      [!!microphonePermission && 'android.permission.RECORD_AUDIO'].filter(Boolean),
    ],
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withAV, pkg.name, pkg.version);
