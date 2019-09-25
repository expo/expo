const { createMetroConfiguration } = require('expo-yarn-workspaces');
const { mergeConfig } = require('metro-config');

const standaloneNCLConfig = require('../standalone-ncl/metro.config');
const bareConfig = createMetroConfiguration(__dirname);

const mergedConfig = mergeConfig(standaloneNCLConfig, bareConfig);

module.exports = mergedConfig;
