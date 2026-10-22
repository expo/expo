'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_REACT_NATIVE_DIR = 'node_modules/react-native';

let reactNativeDir = DEFAULT_REACT_NATIVE_DIR;

/**
 * The command that regenerates the app's SwiftPM setup, to run from the app root.
 *
 * It runs React Native's script directly, not `npx react-native spm update`: Expo apps do not use
 * @react-native-community/cli, which is the wrapper that provides `react-native spm`.
 * build-swiftpm-app-phase.sh (expo-modules-jsi) and README.md cannot import this and repeat the
 * text by hand.
 */
function spmUpdateCommand() {
  return `node ${reactNativeDir}/scripts/setup-apple-spm.js update`;
}

/**
 * Points `spmUpdateCommand` at the app's react-native, which a workspace may hoist above the
 * app. With no argument, it returns to `node_modules/react-native`.
 */
function configureSpmUpdateCommand({ appRoot, reactNativeRoot } = {}) {
  reactNativeDir =
    appRoot == null || reactNativeRoot == null
      ? DEFAULT_REACT_NATIVE_DIR
      : path.relative(realPath(appRoot), realParentPath(reactNativeRoot)).split(path.sep).join('/');
}

// Resolving react-native itself would name pnpm's versioned store path instead of the link.
function realParentPath(dir) {
  return path.join(realPath(path.dirname(dir)), path.basename(dir));
}

// The shell resolves `..` against the real directory, and require.resolve returns real paths, so a
// path relative to a symlinked app root would point elsewhere.
function realPath(dir) {
  try {
    return fs.realpathSync(dir);
  } catch {
    const parent = path.dirname(dir);
    return parent === dir ? dir : path.join(realPath(parent), path.basename(dir));
  }
}

module.exports = { configureSpmUpdateCommand, spmUpdateCommand };
