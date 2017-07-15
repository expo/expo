/**
 *
 * React Native CLI configuration file
 *
 */
'use strict';

const path = require('path');

const { expoBlacklist } = require('../../../react-native-lab/blacklist');
const LabConfig = require('../../../react-native-lab/LabConfig');

module.exports = {
  getProjectRoots() {
    return [path.join(__dirname, '..'), LabConfig.getUniverseRoot()];
  },

  getBlacklistRE() {
    return expoBlacklist([]);
  },

  getTransformModulePath() {
    return LabConfig.getLabTransformerPath();
  },
};
