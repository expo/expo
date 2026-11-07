const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Cached loader metadata contains paths belonging to this temporary project.
config.cacheVersion = __dirname;

module.exports = config;
