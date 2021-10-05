const path = require('path');

module.exports = {
  'expo-dev-launcher': {
    root: resolve('expo-dev-launcher'),
  },
  'expo-dev-menu': {
    root: resolve('expo-dev-menu'),
  },
  'expo-dev-menu-interface': {
    root: resolve('expo-dev-menu-interface'),
  },
  'expo-manifests': {
    root: resolve('expo-manifests'),
  },
  'expo-updates-interface': {
    root: resolve('expo-updates-interface'),
  },
};

function resolve(name) {
  return path.dirname(
    require.resolve(name + '/package.json', {
      paths: [__dirname],
    })
  );
}
