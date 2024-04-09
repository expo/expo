module.exports = {
  name: 'eslint-config-universe/shared/prettier',
  plugins: {
    prettier: require('eslint-plugin-prettier'),
  },
  rules: {
    ...require('eslint-config-prettier').rules,
    'prettier/prettier': ['warn'],
  },
};
