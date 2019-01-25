module.exports = {
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native'],
    hasteImplModulePath: require.resolve('react-native/jest/hasteImpl.js'),
    providesModuleNodeModules: ['react-native'],
  },
  moduleNameMapper: {
    '^React$': require.resolve('react'),
  },
  modulePathIgnorePatterns: ['react-native/Libraries/react-native/'],
  transform: {
    '^.+\\.(js|ts|tsx)$': require.resolve('babel-jest'),
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf|otf|m4v|mov|mp4|mpeg|mpg|webm|aac|aiff|caf|m4a|mp3|wav|html|pdf|obj)$': require.resolve(
      './src/preset/assetFileTransformer.js'
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-clone-referenced-element|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|sentry-expo|native-base))',
  ],
  setupFiles: [
    require.resolve('react-native/jest/setup.js'),
    require.resolve('./src/preset/setup.js'),
  ],
  testEnvironment: require.resolve('jest-environment-node'),
  moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
  testMatch: ['**/__tests__/**/*.(js|ts|tsx)', '**/?(*.)+(spec|test).(js|ts|tsx)'],
};
