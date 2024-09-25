module.exports = require('memfs').fs;

// NOTE(cedric): workaround to also mock `node:fs`
jest.mock('node:fs', () => require('fs'));
