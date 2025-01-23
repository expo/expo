module.exports = {
  root: true,
  extends: ['prettier'],
  plugins: ['prettier'],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    'prettier/prettier': 'warn',
  },
};
