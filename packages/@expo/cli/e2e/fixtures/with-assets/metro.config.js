/* eslint-env node */

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// NOTE: Watchman (used locally but not in CI) has issues with finding modules in the expo/expo monorepo.
config.resolver.useWatchman = false;

module.exports = config;
