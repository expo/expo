// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Let Metro read the module's files in the parent folder. `experiments.autolinkingModuleResolution`
// in app.json then resolves the module, and react-native, expo and other packages that the module
// also installs in ../node_modules, to the copies that autolinking uses for this app.
config.watchFolders = [path.resolve(__dirname, '..')];

module.exports = config;
