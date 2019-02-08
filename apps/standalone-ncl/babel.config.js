module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          '~expo': 'expo',
          expo: './expoResolver',
          'react-native-vector-icons': '@expo/vector-icons',
        },
      },
    ],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
  ],
};
