module.exports = function(api, options) {
  const isWeb = api.caller(isTargetWeb);
  const platformOptions = isWeb
    ? { disableImportExportTransform: false, ...(options.web || {}) }
    : { disableImportExportTransform: true, ...(options.native || {}) };

  return {
    presets: [
      [
        'module:metro-react-native-babel-preset',
        { disableImportExportTransform: platformOptions.disableImportExportTransform },
      ],
    ],
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
      isWeb && ['babel-plugin-react-native-web'],
    ].filter(Boolean),
  };
};

function isTargetWeb(caller) {
  return caller && caller.name === 'babel-loader';
}
