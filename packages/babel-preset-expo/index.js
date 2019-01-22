module.exports = function() {
  const plugins = [
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          'react-native-vector-icons': '@expo/vector-icons',
        },
      },
    ],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
  ];

  // On web add the `react-native-web` plugin.
  if (!process.env.REACT_NATIVE_APP_ROOT) {
    plugins.push('babel-plugin-react-native-web');
  }

  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins,
  };
};
