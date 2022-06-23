const path = require('path');

module.exports = {
  preset: '../cli/jest.config',
  rootDir: path.resolve(__dirname),
  displayName: require('./package').name,
  roots: ['__mocks__', 'src'],
};
