/** @type {import('jest').Config} */
module.exports = {
  ...require('expo-module-scripts/jest-preset-cli'),
  clearMocks: true,
  displayName: require('./package').name,
  moduleNameMapper: {
    '^@expo/config/build/(.*)$': '<rootDir>/../config/src/$1',
    '^@expo/config-plugins/build/(.*)$': '<rootDir>/../config-plugins/src/$1',
    '^\\./plugin/build/withCamera$': '<rootDir>/../../expo-camera/plugin/src/withCamera',
    '^\\./plugin/build/withImagePicker$':
      '<rootDir>/../../expo-image-picker/plugin/src/withImagePicker',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  rootDir: __dirname,
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'expo-source'],
  },
};
