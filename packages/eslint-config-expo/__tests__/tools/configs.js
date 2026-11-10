const path = require('path');

const cwd = path.resolve(__dirname, '..');

/**
 * The two entry points of this package, each paired with the ESLint version that loads it:
 * the legacy (eslintrc) config under ESLint 8 and the flat config under ESLint 9.
 */
module.exports = [
  {
    name: 'legacy',
    ESLint: require('eslint8').ESLint,
    options: {
      cwd,
      overrideConfigFile: path.resolve(__dirname, '../../default.js'),
      useEslintrc: false,
    },
  },
  {
    name: 'flat',
    ESLint: require('eslint').ESLint,
    // ESLint 9 loads a config file with `import()`, which Jest's CommonJS runtime does not
    // support, so the flat config is passed in as an object instead.
    options: {
      cwd,
      overrideConfigFile: true,
      overrideConfig: require('../../flat/default.js'),
    },
  },
];
