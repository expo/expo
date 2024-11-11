const path = require('node:path');
/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Router E2E',
  slug: 'expo-router-e2e',

  sdkVersion: process.env.E2E_ROUTER_USE_PUBLISHED_EXPO_GO ? undefined : 'UNVERSIONED',
  icon: './assets/icon.png',
  scheme: 'router-e2e',

  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'dev.expo.routere2e',
  },
  android: {
    package: 'dev.expo.routere2e',
  },
  // For testing the output bundle
  jsEngine: process.env.E2E_ROUTER_JS_ENGINE ?? (process.env.E2E_ROUTER_SRC ? 'jsc' : 'hermes'),
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  experiments: {
    baseUrl: process.env.EXPO_E2E_BASE_PATH || undefined,
    tsconfigPaths: process.env.EXPO_USE_PATH_ALIASES,
    typedRoutes: true,
    reactCanary: process.env.E2E_CANARY_ENABLED,
    reactCompiler: process.env.E2E_ROUTER_COMPILER,
    reactServerComponentRoutes: process.env.E2E_RSC_ENABLED,
    reactServerFunctions: process.env.EXPO_UNSTABLE_SERVER_ACTIONS,
  },
  web: {
    output: process.env.EXPO_USE_STATIC ?? 'static',
    bundler: 'metro',
  },
  plugins: [
    [
      'expo-build-properties',
      {
        ios: {
          ccacheEnabled: true,
        },
      },
    ],

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
        origin: 'http://localhost:3000/',
        sitemap:
          process.env.E2E_ROUTER_SITEMAP === 'false' ? false : process.env.E2E_ROUTER_SITEMAP,
      },
    ],
  ],
};

if (typeof process.env.E2E_ROUTER_SRC === 'string') {
  process.env.EXPO_PUBLIC_FOLDER = path.join('__e2e__', process.env.E2E_ROUTER_SRC, 'public');
}
