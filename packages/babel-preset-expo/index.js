module.exports = function(api) {
  const isWeb = api.caller(isTargetWeb); // eslint-disable-line no-unused-vars

  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            'react-native-vector-icons': '@expo/vector-icons',
          },
        },
      ],
      ['@babel/plugin-proposal-decorators', { legacy: true }],
    ],
  };
};

function isTargetWeb(caller) {
  return caller && caller.name === 'babel-loader';
}
