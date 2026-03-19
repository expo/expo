/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, { isCSSEnabled: true });
const monorepoRoot = path.join(__dirname, '../..');

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

module.exports = config;
