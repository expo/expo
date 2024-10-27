const { getWebPreset } = require('jest-expo/config/getPlatformPreset');

module.exports = getWebPreset({ isReactServer: true });
