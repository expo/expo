const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(__dirname);

// 1. Watch all files within the monorepo
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(workspaceRoot, 'apps/native-component-list'), // Allow Metro to resolve all files within NCL
  path.join(workspaceRoot, 'apps/test-suite'), // Allow Metro to resolve notification test suite
  path.join(workspaceRoot, 'apps/common'), // Allow Metro to resolve common ThemeProvider
  path.join(workspaceRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(workspaceRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
];

module.exports = config;
