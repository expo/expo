const universalClientPreset = require('expo-module-scripts/jest-preset');

universalClientPreset.projects.push(...require('jest-expo/rsc/jest-preset').projects);

module.exports = universalClientPreset;
