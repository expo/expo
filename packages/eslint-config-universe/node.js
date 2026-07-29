module.exports = {
  extends: ['./shared/core.js', './shared/typescript.js'],
  plugins: ['node'],
  env: { node: true },
  rules: {
    'no-buffer-constructor': 'warn',
    'node/no-path-concat': 'warn',
  },
};
