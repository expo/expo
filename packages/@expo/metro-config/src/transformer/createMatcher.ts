// Copyright 2021-present 650 Industries (Expo). All rights reserved.

export function createModuleMatcher({
  folders = ['node_modules'],
  moduleIds,
}: {
  folders?: string[];
  moduleIds: string[];
}) {
  const modulePathsGroup = folders.join('|');

  const moduleMatchersGroup = moduleIds.join('|');

  const moduleMatcherId =
    '^' + [modulePathsGroup, moduleMatchersGroup].map(value => `(?:${value})`).join('/');

  return new RegExp(moduleMatcherId);
}

export const createReactNativeMatcher = ({ folders }: { folders?: string[] }) =>
  createModuleMatcher({
    folders,
    moduleIds: ['react-native/'],
  });

export const createExpoMatcher = ({ folders }: { folders?: string[] }) =>
  createModuleMatcher({
    folders,
    // We'll work to start reducing this.
    moduleIds: ['expo', '@expo', '@unimodules', '@use-expo'],
  });

// TODO: Make this list as short as possible before releasing.
// TODO: Add SDK version compat list.
export const createKnownCommunityMatcher = ({
  folders,
  moduleIds = [],
}: {
  folders?: string[];
  moduleIds?: string[];
} = {}) =>
  createModuleMatcher({
    folders,
    moduleIds: [
      ...moduleIds,
      // The more complex, the longer the entire project takes...
      // react-native-community, react-native-masked-view, react-native-picker, react-native-segmented-control, react-native
      '@react-',
      // @sentry/react-native
      '@(?:[\\w|-]+)/react-native',
      'react-native-',
      'victory-',
      'native-base',
      'styled-components',
      // three.js
      'three/build/three.module.js',
      'three/examples/jsm',
      // Special case for testing expo/expo repo
      'html-elements/',
      // shared-element
      'react-navigation-',
    ],
  });
