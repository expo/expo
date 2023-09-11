const resolveFrom = require(require.resolve('resolve-from'));

const silent = (fromDirectory: string, request: string) => {
  const fs = require('fs');
  const path = require('path');
  try {
    fromDirectory = fs.realpathSync(fromDirectory);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      fromDirectory = path.resolve(fromDirectory);
    } else {
      return;
    }
  }

  let outputPath = path.join(fromDirectory, 'node_modules', request);
  if (fs.existsSync(outputPath)) {
    return outputPath;
  }
  if (!path.extname(outputPath)) {
    outputPath += '.js';
  }
  if (fs.existsSync(outputPath)) {
    return outputPath;
  }
  outputPath = path.join(fromDirectory, request);
  if (fs.existsSync(outputPath)) {
    return outputPath;
  }
};

module.exports = jest.fn((fromDirectory, request) => {
  const path = silent(fromDirectory, request);
  if (!path) {
    return resolveFrom(fromDirectory, request);
  }
  return path;
});

module.exports.silent = jest.fn(silent);
