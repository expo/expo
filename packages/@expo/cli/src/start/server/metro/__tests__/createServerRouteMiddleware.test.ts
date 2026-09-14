import type { MiddlewareMatcher } from 'expo-server';
import { createRequestHandler } from 'expo-server/adapter/http';

import { createRouteHandlerMiddleware } from '../createServerRouteMiddleware';
import { fetchManifest } from '../fetchRouterManifest';
import { warnInvalidMiddlewareMatcherSettings } from '../router';

jest.mock('expo-server/adapter/http', () => ({ createRequestHandler: jest.fn() }));
jest.mock('resolve-from', () => ({ silent: jest.fn(() => '/expo-router') }));
jest.mock('../fetchRouterManifest', () => ({ fetchManifest: jest.fn() }));

describe(warnInvalidMiddlewareMatcherSettings, () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('methods', () => {
    it('logs if methods is not an array', () => {
      const matcher = {
        methods: {},
      } as unknown as MiddlewareMatcher;
      warnInvalidMiddlewareMatcherSettings(matcher);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Middleware matcher methods must be an array of valid HTTP methods.'
        )
      );
    });

    it('logs for invalid methods', () => {
      const matcher = {
        methods: ['GET', 'INVALID', 'POST'],
      };
      warnInvalidMiddlewareMatcherSettings(matcher);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid middleware HTTP method: INVALID.')
      );
    });
  });

  describe('patterns', () => {
    it('logs if patterns are not a string or regex', () => {
      const matcher = {
        patterns: [1, null, undefined, {}, []],
      } as unknown as MiddlewareMatcher;
      warnInvalidMiddlewareMatcherSettings(matcher);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(5);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Middleware matcher patterns must be strings or regular expressions.'
        )
      );
    });

    it('logs if string pattern do not begin with /', () => {
      const matcher = {
        patterns: ['api'],
      };
      warnInvalidMiddlewareMatcherSettings(matcher);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`String patterns in middleware matcher must start with '/'`)
      );
    });
  });
});

describe(createRouteHandlerMiddleware, () => {
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
        ['static', 'server'].includes(output ?? '') ? '_expo/loaders/index.js' : undefined
      );
    }
  );
});
