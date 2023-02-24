"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createKnownCommunityMatcher = exports.createExpoMatcher = void 0;
exports.createModuleMatcher = createModuleMatcher;
exports.createReactNativeMatcher = void 0;
// Copyright 2021-present 650 Industries (Expo). All rights reserved.

function createModuleMatcher({
  folders = ['node_modules'],
  moduleIds
}) {
  const modulePathsGroup = folders.join('|');
  const moduleMatchersGroup = moduleIds.join('|');
  const moduleMatcherId = '^' + [modulePathsGroup, moduleMatchersGroup].map(value => `(?:${value})`).join('/');
  return new RegExp(moduleMatcherId);
}
const createReactNativeMatcher = ({
  folders
}) => createModuleMatcher({
  folders,
  moduleIds: ['react-native/']
});
exports.createReactNativeMatcher = createReactNativeMatcher;
const createExpoMatcher = ({
  folders
}) => createModuleMatcher({
  folders,
  // We'll work to start reducing this.
  moduleIds: ['expo', '@expo', '@use-expo']
});

// TODO: Make this list as short as possible before releasing.
// TODO: Add SDK version compat list.
exports.createExpoMatcher = createExpoMatcher;
const createKnownCommunityMatcher = ({
  folders,
  moduleIds = []
} = {}) => createModuleMatcher({
  folders,
  moduleIds: [...moduleIds,
  // The more complex, the longer the entire project takes...
  // react-native-community, react-native-masked-view, react-native-picker, react-native-segmented-control, react-native
  '@react-',
  // @sentry/react-native
  '@(?:[\\w|-]+)/react-native', 'react-native-', 'victory-', 'native-base', 'styled-components',
  // three.js
  'three/build/three.module.js', 'three/examples/jsm',
  // Special case for testing expo/expo repo
  'html-elements/',
  // shared-element
  'react-navigation-']
});
exports.createKnownCommunityMatcher = createKnownCommunityMatcher;
//# sourceMappingURL=createMatcher.js.map