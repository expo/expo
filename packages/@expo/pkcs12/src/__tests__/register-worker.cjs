const { readFileSync } = require('fs');
const { createRequire } = require('module');

const internalRequire = createRequire(require.resolve('@expo/internal-scripts/package.json'));
const { transformSync } = internalRequire('@swc/core');
const preset = require('@expo/internal-scripts/jest-preset-cli');
const [, options] = Object.values(preset.transform)[0];

// Node workers need the same TypeScript transform as Jest
require.extensions['.ts'] = (module, filename) => {
  const { code } = transformSync(readFileSync(filename, 'utf8'), { ...options, filename });
  module._compile(code, filename);
};
