const path = require('node:path');
/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Router E2E',
  slug: 'expo-router-e2e',

  sdkVersion: 'UNVERSIONED',
  icon: './assets/icon.png',
  scheme: 'router-e2e',

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'dev.expo.routere2e',
  },
  android: {
    package: 'dev.expo.routere2e',
  },
  // For testing the output bundle
  jsEngine: process.env.E2E_ROUTER_JS_ENGINE ?? (process.env.E2E_ROUTER_SRC ? 'jsc' : 'hermes'),
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  experiments: {
    baseUrl: process.env.EXPO_E2E_BASE_PATH || undefined,
    tsconfigPaths: process.env.EXPO_USE_PATH_ALIASES,
    typedRoutes: true,
  },
  web: {
    output: process.env.EXPO_USE_STATIC ?? 'static',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-router',
      {
        asyncRoutes:
          process.env.E2E_ROUTER_ASYNC === 'true'
            ? true
            : process.env.E2E_ROUTER_ASYNC === 'false'
              ? false
              : process.env.E2E_ROUTER_ASYNC || false,
        root: path.join('__e2e__', process.env.E2E_ROUTER_SRC ?? 'static-rendering', 'app'),
        origin: 'https://smart-symbiote.netlify.app/',
      },
    ],
  ],
};
