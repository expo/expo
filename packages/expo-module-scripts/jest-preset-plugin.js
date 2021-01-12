const createJestPreset = require('./createJestPreset');

const nodePreset = createJestPreset(require('jest-expo/node/jest-preset'));

module.exports = nodePreset
