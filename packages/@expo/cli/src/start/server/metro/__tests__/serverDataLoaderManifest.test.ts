import { createRequestHandler } from 'expo-server/adapter/http';

import { createRouteHandlerMiddleware } from '../createServerRouteMiddleware';
import { fetchManifest } from '../fetchRouterManifest';

jest.mock('expo-server/adapter/http', () => ({ createRequestHandler: jest.fn() }));
jest.mock('resolve-from', () => ({ silent: jest.fn(() => '/expo-router') }));
jest.mock('../fetchRouterManifest', () => ({ fetchManifest: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it.each(['static', 'server', 'single', undefined] as const)(
  'only exposes data loaders for static and server output (output: %s)',
  async (output) => {
    jest.mocked(fetchManifest).mockResolvedValue({
      htmlRoutes: [{ file: 'index.tsx', page: '/index', namedRegex: /^\/$/, routeKeys: {} }],
      apiRoutes: [],
      notFoundRoutes: [],
      redirects: [],
      rewrites: [],
    });

    createRouteHandlerMiddleware('/', {
      appDir: '/app',
      routerRoot: 'app',
      config: {
        exp: { name: 'test', slug: 'test', web: { output } },
        pkg: {},
        rootConfig: { expo: { name: 'test', slug: 'test' } },
        staticConfigPath: null,
        dynamicConfigPath: null,
        dynamicConfigObjectType: null,
        hasUnusedStaticConfig: false,
      },
      headers: {},
      getStaticPageAsync: async () => ({ content: '' }),
      bundleApiRoute: async () => null,
      executeLoaderAsync: async () => undefined,
      // RSC installs the route middleware even for single-page output.
      rsc: {
        path: '/_flight',
        handler: {
          GET: async () => new Response(),
          POST: async () => new Response(),
        },
      },
    });

    const hooks = jest.mocked(createRequestHandler).mock.calls[0]![1]!;
    const manifest = await hooks.getRoutesManifest!();
    expect(manifest?.htmlRoutes[0]?.loader).toBe(
      output === 'static' || output === 'server' ? '_expo/loaders/index.js' : undefined
    );
  }
);
