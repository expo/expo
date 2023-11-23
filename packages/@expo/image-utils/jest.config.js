const path = require('path');

const enableE2E = process.env.CI || process.env.E2E;
const roots = ['src', enableE2E && 'e2e'].filter(Boolean);

module.exports = {
  preset: '../../jest/unit-test-config',
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots,
};
