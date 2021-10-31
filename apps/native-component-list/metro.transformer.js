// https://github.com/expo/expo-cli/tree/master/packages/metro-config#readme
const { createExoticTransformer } = require('@expo/metro-config/transformer');

module.exports = createExoticTransformer({
  // You can uncomment the following lines to add any extra node_modules paths in a monorepo:
  nodeModulesPaths: [
    'node_modules',
    // Generally you'll add this when your config is in `apps/my-app/metro.config.js`
    '../../node_modules',
    // If you have custom packages in a `packages/` folder
    '../../packages',
    // Add react-native fork support
    '../../react-native-lab',
  ],
});
