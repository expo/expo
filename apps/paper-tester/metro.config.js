/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// NOTE(cedric): `@babel/runtime/*` helpers are used as CJS, while being resolved as ESM causing issues
// We need to resolve that before launching SDK 53 and remove this option.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
