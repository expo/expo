const { defineConfig } = require('eslint/config');

const coreConfig = require('./shared/core.js');
const typescriptConfig = require('./shared/typescript.js');

module.exports = defineConfig([coreConfig, typescriptConfig]);
