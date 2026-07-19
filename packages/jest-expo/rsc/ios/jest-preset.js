const { getIOSPreset } = require('jest-expo/config/getPlatformPreset');

module.exports = getIOSPreset({ isReactServer: true });
