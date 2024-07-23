module.exports = {
  root: true,
  extends: ['./default.js', 'prettier'],
  plugins: ['prettier'],
  env: {
    node: true,
  },
  rules: {
    'prettier/prettier': 'warn',
  },
};
