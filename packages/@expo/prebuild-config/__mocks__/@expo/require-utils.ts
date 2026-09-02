// Replace `resolveFrom` so it resolves via the mocked `fs` (memfs) instead of
// falling back to Node's native `Module._resolveFilename`, which reads the real
// on-disk filesystem and breaks tests that use memfs fixtures.

const actual = jest.requireActual('@expo/require-utils');

function mockResolveFrom(fromDirectory: string, moduleId: string): string | null {
  const fs = require('fs');
  const path = require('path');
  try {
    fromDirectory = fs.realpathSync(fromDirectory);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      fromDirectory = path.resolve(fromDirectory);
    } else {
      return null;
    }
  }

  const outputPath = path.join(fromDirectory, 'node_modules', moduleId);
  if (fs.existsSync(outputPath)) {
    return outputPath;
  }
  return null;
}

module.exports = {
  ...actual,
  resolveFrom: mockResolveFrom,
};
