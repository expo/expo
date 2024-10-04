module.exports = {
  root: true,
  extends: ['universe/node'],
  plugins: ['lodash'],
  ignorePatterns: ['**/build', '**/cache', '**/node_modules'],
  rules: {
    'lodash/import-scope': [2, 'method'],
    // note(simek): I'm not brave enough to touch the RegExps I did not write,
    // if you are, feel free to remove line below and fix the reported issues
    'no-useless-escape': 0,
  },
};
