const path = require('path');

module.exports = {
  preset: '../../jest/unit-test-config',
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots: ['__mocks__', 'src'],
};
