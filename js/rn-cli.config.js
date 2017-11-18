// Copyright 2015-present 650 Industries. All rights reserved.

'use strict';

let isInUniverse = true;
let expoBlacklist;
let blacklist;
try {
  expoBlacklist = require('../../react-native-lab/blacklist').expoBlacklist;
} catch (e) {
  isInUniverse = false;
  blacklist = require('./node_modules/metro-bundler/src/blacklist');
}

const path = require('path');

module.exports = {
  getProjectRoots() {
    let roots = [path.join(__dirname)];

    if (isInUniverse) {
      roots.push(path.join(__dirname, '..', '..'));
    }

    return roots;
  },

  getBlacklistRE() {
    if (expoBlacklist) {
      return expoBlacklist([]);
    } else {
      return blacklist([]);
    }
  },

  getTransformModulePath() {
    if (isInUniverse) {
      const LabConfig = require('../../react-native-lab/LabConfig');
      return LabConfig.getLabTransformerPath();
    } else {
      return path.resolve(
        './node_modules/metro-bundler/src/transformer.js'
      );
    }
  },
};
