const { tsExtensions } = require('./extensions');

// react-native's main module is Flow, not JavaScript, and raises parse errors. Additionally,
// several other react-native-related packages still publish Flow code as their main source.
const importIgnore = ['node_modules[\\\\/]+@?react-native'];

const importParsers = {
  'import/parsers': {
    '@typescript-eslint/parser': tsExtensions,
  },
};

function importSettings(extensions) {
  return {
    'import/extensions': extensions,
    'import/resolver': {
      node: { extensions },
    },
  };
}

module.exports = { importIgnore, importParsers, importSettings };
