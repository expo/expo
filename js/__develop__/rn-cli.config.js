/**
 *
 * React Native CLI configuration file
 *
 */
'use strict';

const blacklist = require('react-native/packager/blacklist');
const path = require('path');
const rootPath = escapeRegExp(path.join(__dirname, '..', '..', '..'));
const projectPath = escapeRegExp(__dirname);

module.exports = {
  getProjectRoots() {
    return this._getRoots();
  },

  getAssetRoots() {
    return this._getRoots();
  },

  getBlacklistRE() {
    let blackListREs = [
      new RegExp(`^${rootPath}\/dev\/.*$`),
      new RegExp(
        `^${rootPath}\/expo\/(android|ios|tools|versioned-react-native|android-shell-app|exponent-view-template)\/.*`
      ),
      new RegExp(
        `^${rootPath}\/expo\/.*\/node_modules\/(react-native|react)\/.*`
      ),
      new RegExp(`^${rootPath}\/apps\/.*`),
      new RegExp(
        `^${rootPath}\/dev\/.*\/node_modules\/(react-native|react)\/.*`
      ),
      new RegExp(
        `^${rootPath}\/libraries\/.*\/node_modules\/(react-native|react)\/.*`
      ),
    ];

    return blacklist(blackListREs);
  },

  _getRoots() {
    return [path.join(__dirname, '..'), path.join(__dirname, '..', '..', '..')];
  },

  getTransformModulePath() {
    return path.resolve('../../../react-native-lab/transformer.js');
  },

  getTransformOptions() {
    return {
      reactNativePath: path.resolve('../../../react-native-lab/react-native'),
      reactPath: path.resolve(
        '../../../react-native-lab/react-native/node_modules/react'
      ),
      expoPath: path.resolve('../../../libraries/expo-sdk'),
    };
  },
};

function escapeRegExp(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
