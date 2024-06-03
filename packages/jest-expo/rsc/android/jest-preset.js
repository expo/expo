const { getAndroidPreset } = require('jest-expo/config/getPlatformPreset');

module.exports = getAndroidPreset({ isReactServer: true });
