// Learn more https://docs.expo.io/guides/customizing-metro

/** @type {import('expo/metro-config')} */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
