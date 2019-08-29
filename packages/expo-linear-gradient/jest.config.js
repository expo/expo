const { getWebPreset, getIOSPreset, getAndroidPreset } = require('jest-expo/src/getPlatformPreset');
const withEnzyme = require('jest-expo/src/enzyme');

module.exports = {
  projects: [
    withEnzyme(getIOSPreset()),
    withEnzyme(getAndroidPreset()),
    withEnzyme(getWebPreset()),
  ],
};
