// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = config.watchFolders.filter((folder) => !folder.endsWith('/expo-router'));

module.exports = config;
