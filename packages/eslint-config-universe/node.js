module.exports = {
  extends: ['./shared/core.js', './shared/typescript.js', './shared/prettier.js'],
  env: { node: true },
  rules: {
    'no-buffer-constructor': 'warn',
  },
};
