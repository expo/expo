const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = (config) => {
  config.slug = 'from-custom-plugin';
  // test that the mods don't get serialized
  return withAndroidManifest(config, (config) => config);
};
