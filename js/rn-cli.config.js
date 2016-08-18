// Copyright 2015-present 650 Industries. All rights reserved.

'use strict';

let isInUniverse = true;
let exponentBlacklist;
let blacklist;
try {
  exponentBlacklist = require('../../react-native-lab/blacklist').exponentBlacklist;
} catch (e) {
  isInUniverse = false;
  blacklist = require(`./node_modules/react-native/packager/blacklist`);
}

const path = require('path');

module.exports = {
  getProjectRoots() {
    return this._getRoots();
  },

  getAssetRoots() {
    return [
      path.join(__dirname, '..', 'ios', 'Exponent', 'Images.xcassets'),
    ];
  },

  getBlacklistRE(platform) {
    if (exponentBlacklist) {
      return exponentBlacklist(platform, []);
    } else {
      return blacklist(platform, []);
    }
  },

  _getRoots() {
    let roots = [
      path.join(__dirname),
    ];

    if (isInUniverse) {
      roots.push(path.join(__dirname, '..', '..'));
    }

    return roots;
  },
};
