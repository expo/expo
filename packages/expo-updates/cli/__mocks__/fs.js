const { fs } = require('memfs');

module.exports = fs;

// NOTE(cedric): workaround to also mock `node:fs`
jest.mock('node:fs', () => require('memfs').fs);
