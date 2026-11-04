module.exports = require('memfs').fs.promises;

// NOTE(cedric): workaround to also mock `node:fs/promises`
jest.mock('node:fs/promises', () => require('memfs').fs.promises);
