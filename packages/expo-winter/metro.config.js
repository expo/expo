// const { createMetroConfiguration } = require("expo-yarn-workspaces");

/** @type {import('expo/metro-config').MetroConfig} */
const config = {};
const path = require('path');

const root = path.join(__dirname, '../..');

config.watchFolders = [__dirname, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

module.exports = config;
