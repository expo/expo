const fs = require('memfs').fs;
fs.promises.glob = async function* (pattern, options = {}) {
  const files = await require('tinyglobby').glob(pattern, {
    ...options,
    onlyFiles: false,
    expandDirectories: false,
    fs,
  });
  yield* files.map((file) => file.replace(/\/$/, ''));
};
module.exports = fs.promises;

// NOTE(cedric): workaround to also mock `node:fs/promises`
jest.mock('node:fs/promises', () => require('memfs').fs.promises);
