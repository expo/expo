const { createReactNativeConfiguration } = require('expo-yarn-workspaces');

module.exports = {
  ...createReactNativeConfiguration(__dirname),

  getTransformModulePath() {
    return require.resolve('react-native-typescript-transformer');
  },
  getSourceExts() {
    return ['ts', 'tsx'];
  },
};
