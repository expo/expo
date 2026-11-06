// Keep the sources under `/middleware/` so the other suites never hit them.
const defaultRedirects = [{ source: '/middleware/redirect', destination: 'https://expo.dev' }];
const defaultRewrites = [
  { source: '/middleware/rewrite', destination: '/middleware/redirect-target' },
];

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Server Tester',
  slug: 'server-tester',
  sdkVersion: 'UNVERSIONED',
  icon: './assets/icon.png',
  scheme: 'server-tester',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    appleTeamId: process.env.APPLE_TEAM_ID,
    bundleIdentifier: 'dev.expo.servertester',
  },
  android: {
    package: 'dev.expo.servertester',
  },
  jsEngine: 'hermes',
  newArchEnabled: true,
  experiments: {
    chunking: {
      mode: process.env.E2E_ROUTER_SPLIT_STRATEGY === 'granular' ? 'granular' : 'legacy',
    },
    noxcturnalTransformWorker: true,
    autolinkingModuleResolution: true,
    baseUrl: process.env.EXPO_E2E_BASE_PATH || undefined,
    tsconfigPaths: process.env.EXPO_USE_PATH_ALIASES,
    typedRoutes: true,
  },
  web: {
    output: process.env.E2E_ROUTER_WEB_OUTPUT ?? 'server',
    bundler: 'metro',
    favicon: process.env.E2E_FAVICON || undefined,
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
      },
    ],
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
        asyncRoutes: parseAsyncRoutes(process.env.E2E_ROUTER_ASYNC),
        origin: 'http://localhost:8081/',
        sitemap:
          process.env.E2E_ROUTER_SITEMAP === 'false' ? false : process.env.E2E_ROUTER_SITEMAP,
        redirects: parseJsonEnv(process.env.E2E_ROUTER_REDIRECTS) ?? defaultRedirects,
        rewrites: parseJsonEnv(process.env.E2E_ROUTER_REWRITES) ?? defaultRewrites,
        headers: parseJsonEnv(process.env.E2E_ROUTER_HEADERS),
        pageHeaders: parseJsonEnv(process.env.E2E_ROUTER_PAGE_HEADERS),
        apiRoutes: process.env.E2E_ROUTER_API_ROUTES
          ? process.env.E2E_ROUTER_API_ROUTES === 'true'
          : undefined,
      },
    ],
  ],
};

function parseAsyncRoutes(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function parseJsonEnv(value) {
  return value ? JSON.parse(value) : undefined;
}
