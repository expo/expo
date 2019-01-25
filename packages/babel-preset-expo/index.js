module.exports = function(api) {
  const isWeb = api.caller(isTargetWeb);

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
  if (isWeb) {
    plugins.push('babel-plugin-react-native-web');
  }

  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins,
  };
};

function isTargetWeb(caller) {
  return caller && caller.name === 'babel-loader';
}
