module.exports = {
  name: 'expo/eslint/expo',
  plugins: {
    expo: require('eslint-plugin-expo'),
  },
  rules: {
    'expo/no-env-var-destructuring': ['error'],
    'expo/no-dynamic-env-var': ['error'],
  },
};
