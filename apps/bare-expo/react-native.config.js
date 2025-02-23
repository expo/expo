// to work around codegen issue with 78.0.0
// https://github.com/facebook/react-native/issues/49566
module.exports = {
  dependencies: {
    'react-native-webview': {
      platforms: {
        android: null,
      },
    },
    'react-native-pager-view': {
      platforms: {
        android: null,
      },
    },
  },
};
