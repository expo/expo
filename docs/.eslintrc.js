module.exports = {
  root: true,
  extends: ['universe/node', 'universe/web'],
  plugins: ['lodash'],
  rules: {
    'lodash/import-scope': [2, 'method'],
  },
};
