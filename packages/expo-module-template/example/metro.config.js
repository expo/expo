// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve the module by its name to the parent folder, and let Metro read files from there.
// `experiments.autolinkingModuleResolution` in app.json makes Metro use this app's copies of
// react-native, expo and other packages that the module also installs in ../node_modules.
config.resolver.extraNodeModules = {
  '<%- project.slug %>': '..',
};

config.watchFolders = [path.resolve(__dirname, '..')];

module.exports = config;
