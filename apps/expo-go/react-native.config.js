const DISABLED_AUTOLINKING_PKGS = [
  '@react-native-async-storage/async-storage',
  '@react-native-community/netinfo',
];

module.exports = {
  dependencies: {
    ...createDisabledAutolinkingConfig(),
  },
};

function createDisabledAutolinkingConfig() {
  const config = {};
  for (const pkg of DISABLED_AUTOLINKING_PKGS) {
    config[pkg] = {
      platforms: {
        android: null,
        ios: null,
      },
    };
  }
  return config;
}
