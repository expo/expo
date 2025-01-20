/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Router E2E with spaces',
  slug: 'expo-router-e2e-with-spaces',

  sdkVersion: 'UNVERSIONED',
  icon: './assets/icon.png',
  scheme: 'router-e2e-with-spaces',

  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'dev.expo.routere2ewithspaces',
  },
  android: {
    package: 'dev.expo.routere2ewithspaces',
  },
  // For testing the output bundle
  jsEngine: process.env.E2E_ROUTER_JS_ENGINE ?? (process.env.E2E_ROUTER_SRC ? 'jsc' : 'hermes'),
  newArchEnabled: true,
  experiments: {
    baseUrl: process.env.EXPO_E2E_BASE_PATH || undefined,
    tsconfigPaths: process.env.EXPO_USE_PATH_ALIASES,
    typedRoutes: true,
    reactCanary: process.env.E2E_CANARY_ENABLED,
    reactCompiler: process.env.E2E_ROUTER_COMPILER,
    reactServerComponentRoutes: process.env.E2E_RSC_ENABLED,
    reactServerFunctions: process.env.E2E_SERVER_FUNCTIONS,
  },
  web: {
    output: process.env.EXPO_USE_STATIC ?? 'static',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-router',
      {
        origin: 'http://localhost:8081/',
      },
    ],
  ],
};
