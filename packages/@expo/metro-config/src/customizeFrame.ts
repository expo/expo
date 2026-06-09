// Copyright 2023-present 650 Industries (Expo). All rights reserved.
import type { SymbolicatorConfigT } from '@expo/metro/metro-config';
import { isAbsolute } from 'node:path';
import { URL } from 'node:url';

import { toPosixPath } from './utils/filePath';

type CustomizeFrameFunc = SymbolicatorConfigT['customizeFrame'];

// Import only the types here, the values will be imported from the project, at runtime.
export const INTERNAL_CALLSITES_REGEX = new RegExp(
  [
    '/Libraries/Renderer/implementations/.+\\.js$',
    '/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/Libraries/YellowBox/.+\\.js$',
    '/Libraries/LogBox/.+\\.js$',
    '/Libraries/Core/Timers/.+\\.js$',
    'node_modules/react-devtools-core/.+\\.js$',
    'node_modules/react-refresh/.+\\.js$',
    'node_modules/scheduler/.+\\.js$',
    // Metro replaces `require()` with a different method,
    // we want to omit this method from the stack trace.
    // This is akin to most React tooling.
    '/metro/.*/polyfills/require.js$',
    // Hide frames related to a fast refresh.
    '/metro/.*/lib/bundle-modules/.+\\.js$',
    'node_modules/react-native/Libraries/Utilities/HMRClient.js$',
    'node_modules/eventemitter3/index.js',
    'node_modules/event-target-shim/dist/.+\\.js$',
    // Improve errors thrown by invariant (ex: `Invariant Violation: "main" has not been registered`).
    'node_modules/invariant/.+\\.js$',
    // Remove babel runtime additions
    'node_modules/regenerator-runtime/.+\\.js$',
    // Remove react native setImmediate ponyfill
    'node_modules/promise/setimmediate/.+\\.js$',
    // Babel helpers that implement language features
    'node_modules/@babel/runtime/.+\\.js$',
    // Hide Hermes internal bytecode
    '/(?:InternalBytecode/)?InternalBytecode\\.js$',
    // Block native code invocations
    `\\[native code\\]`,
    // Hide react-dom (web)
    'node_modules/react-dom/.+\\.js$',
    // Hide node.js evaluation code
    'node_modules/require-from-string/.+\\.js$',
    // Block expo's metro-runtime
    '@expo/metro-runtime/.+\\.ts',
    '@expo/server/.+\\.ts',
    'expo-server/.+\\.ts',
    // Block upstream metro-runtime
    '/metro-runtime/.+\\.js$',
    // Expo's metro-runtime require patch:
    '@expo/metro-config/require/.+',

    // Block all whatwg polyfills
    'node_modules/whatwg-.+\\.js$',
    // Hide expo-router warnings which are often wrapping all routes and imports.
    'node_modules/expo-router/build/',
    // No Expo CLI logs
    '/@expo/cli/.+',
    // No context modules as these are virtual
    '.+?ctx=[a-zA-Z0-9]+$',
    // Hide react-native-web warning wrappers. These are most likely related to style deprecations.
    '/react-native-web/dist/.+\\.js$',
    // React Server Components adapter (note we should probably use an Expo-Metro-specific version in the future).
    'node_modules/react-server-dom-webpack/.+\\.js$',

    // Block all node modules.
    'node_modules/.+/',
  ].join('|')
);

function isUrl(value: string): boolean {
  // Windows absolute paths (e.g. `C:\path\to\file.js`) are parsed as a URL with a
  // single-letter (drive) protocol by `new URL`. Treat those as file paths, not URLs,
  // otherwise every Windows frame is incorrectly collapsed and stripped of its location.
  if (isAbsolute(value)) {
    return false;
  }
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * The default frame processor. This is used to modify the stack traces.
 * This method attempts to collapse all frames that aren't relevant to
 * the user by default.
 */
export function getDefaultCustomizeFrame(): CustomizeFrameFunc {
  return (frame: Parameters<CustomizeFrameFunc>[0]) => {
    if (frame.file && isUrl(frame.file)) {
      return {
        ...frame,
        // HACK: This prevents Metro from attempting to read the invalid file URL it sent us.
        lineNumber: null,
        column: null,
        // This prevents the invalid frame from being shown by default.
        collapse: true,
      };
    }
    // INTERNAL_CALLSITES_REGEX uses POSIX separators (`/`). On Windows `frame.file`
    // uses `\`, so it must be normalized to POSIX or no library frames would collapse.
    let collapse = Boolean(frame.file && INTERNAL_CALLSITES_REGEX.test(toPosixPath(frame.file)));

    if (!collapse) {
      // This represents the first frame of the stacktrace.
      // Often this looks like: `__r(0);`.
      // The URL will also be unactionable in the app and therefore not very useful to the developer.
      if (
        frame.column === 3 &&
        frame.methodName &&
        ['global', 'global code'].includes(frame.methodName) &&
        frame.file?.match(/^https?:\/\//g)
      ) {
        collapse = true;
      } else if (
        (frame.file === 'unknown' || frame.file === '<anonymous>') &&
        (frame.column == null || frame.column === -1)
      ) {
        // If we definitively don't have a file, as indicated by the invalid column value,
        // this frame won't be able to desymbolicate properly
        collapse = true;
      } else if (frame.file === '<native>') {
        collapse = true;
      } else if (
        // Some internal component stacks often don't have a file name.
        frame.file === '<anonymous>' &&
        frame.methodName &&
        [
          // React
          'Suspense',
          // React Native
          'RCTView',
          'RCTScrollView',
          'RCTScrollContentView',
          // React Native Screens
          'RNSScreen',
          'RNSScreenContentWrapper',
          'RNSScreenNavigationContainer',
        ].includes(frame.methodName)
      ) {
        collapse = true;
      }
    }

    return { ...(frame || {}), collapse };
  };
}
