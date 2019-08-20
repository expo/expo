module.exports = {
  extends: [
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/babel',
    'prettier/flowtype',
    'prettier/react',
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['warn'],
  },
};
