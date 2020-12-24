const {
  createRunOncePlugin,
  IOSConfig,
} = require('@expo/config-plugins');

const withSensors = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { motionPermission = 'Allow $(PRODUCT_NAME) to use device motion' } = {}
) => {
  return IOSConfig.Permissions.withPermissions(config, {
    NSMotionUsageDescription: motionPermission || null,
  });
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withSensors, pkg.name, pkg.version);
