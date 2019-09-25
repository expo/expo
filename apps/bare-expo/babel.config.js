module.exports = function(api) {
  api.cache(true);
  return {
    // [Custom] Needed for decorators
    presets: ['babel-preset-expo'],
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
    ],
  };
};
