/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const dir = __dirname;

module.exports = {
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native'],
    hasteImplModulePath: require.resolve('react-native/jest/hasteImpl.js'),
    providesModuleNodeModules: ['react-native'],
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
  moduleNameMapper: {
    '^React$': require.resolve('react'),
  },
  modulePathIgnorePatterns: [`${dir}/Libraries/react-native/`],
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf|otf|m4v|mov|mp4|mpeg|mpg|webm|aac|aiff|caf|m4a|mp3|wav|html|pdf|obj)$': require.resolve(
      'jest-expo/src/preset/assetFileTransformer.js'
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-clone-referenced-element|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|sentry-expo|native-base))',
  ],
  testMatch: ['**/__tests__/**/*.(js|ts|tsx)', '**/?(*.)+(spec|test).(js|ts|tsx)'],
  setupFiles: ['react-native/jest/setup.js', 'jest-expo/src/preset/setup.js'],
  testEnvironment: 'node',
};
