// Learn more https://docs.expo.io/guides/customizing-metro

/** @type {import('expo/metro-config')} */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

module.exports = config;
