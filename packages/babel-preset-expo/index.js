module.exports = {
  presets: ['react-native'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          'react-native-vector-icons': '@expo/vector-icons',
        },
      },
    ],
    'transform-decorators-legacy',
    'transform-exponentiation-operator',
    'transform-export-extensions',
  ],
};
