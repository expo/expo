import { getConfig } from '@expo/config';

import { fetchManifest } from '../../metro/fetchRouterManifest';
import { DataLoaderModuleMiddleware } from '../DataLoaderModuleMiddleware';
import { ServerRequest, ServerResponse } from '../server.types';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(),
}));

jest.mock('../../metro/fetchRouterManifest', () => ({
  fetchManifest: jest.fn(),
}));

function getMockRes() {
  return {
    end: jest.fn(),
    setHeader: jest.fn(),
    statusCode: 200,
    on: jest.fn(),
  } as unknown as ServerResponse;
}

describe(DataLoaderModuleMiddleware, () => {
  const mockProjectRoot = '/project';
  const mockAppDir = '/project/app';
  const mockDevServerUrl = 'http://localhost:8081';
  const mockExecuteRouteLoader = jest.fn();
  const mockGetDevServerUrl = jest.fn(() => mockDevServerUrl);
  const mockFetchManifest = fetchManifest as jest.MockedFunction<typeof fetchManifest>;

  let middleware: DataLoaderModuleMiddleware;

  beforeEach(() => {
    jest.clearAllMocks();

    (getConfig as jest.Mock).mockReturnValue({
      exp: {
        extra: {
          router: {
            unstable_useServerDataLoaders: true,
          },
        },
      },
    });

    // Mock the manifest with a catch-all route that matches any path
    mockFetchManifest.mockResolvedValue({
      apiRoutes: [],
      htmlRoutes: [
        {
          file: 'catch-all.js',
          page: '[...slug]',
          routeKeys: { slug: 'slug' },
          namedRegex: /.*/,
        },
      ],
      notFoundRoutes: [],
      redirects: [],
      rewrites: [],
    });

    middleware = new DataLoaderModuleMiddleware(
      mockProjectRoot,
      mockAppDir,
      mockExecuteRouteLoader,
      mockGetDevServerUrl
    );
  });

  describe('shouldHandleRequest()', () => {
    it('returns false when the feature is disabled', () => {
      (getConfig as jest.Mock).mockReturnValue({
        exp: {
          extra: {
            router: {
              unstable_useServerDataLoaders: false,
            },
          },
        },
      });

      expect(
        middleware.shouldHandleRequest({
          url: '/_expo/loaders/index',
        })
      ).toBe(false);
    });

    it.each(['/_expo/loaders/index', '/_expo/loaders/posts/[id]'])(
      'should return true for valid loader path %s',
      (url) => {
        expect(middleware.shouldHandleRequest({ url })).toBe(true);
      }
    );

    it.each(['/', '/api/data', '/_expo/other', '/expo/loaders/index', '/_expo', '/_expo/'])(
      'returns false for non-loader path %s',
      (url) => {
        expect(middleware.shouldHandleRequest({ url })).toBe(false);
      }
    );

    it('returns false when config is missing', () => {
      (getConfig as jest.Mock).mockReturnValue({
        exp: {},
      });

      expect(
        middleware.shouldHandleRequest({
          url: '/_expo/loaders/index',
        })
      ).toBe(false);
    });
  });

  describe('handleRequestAsync()', () => {
    it('generates a loader module', async () => {
      const loaderData = { foo: 'bar', count: 42 };
      mockExecuteRouteLoader.mockResolvedValue({ data: loaderData });

      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/index',
          method: 'GET',
        },
        res,
        next
      );

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        new URL('/', mockDevServerUrl),
        expect.objectContaining({
          namedRegex: expect.any(RegExp),
        }),
        undefined
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledWith(JSON.stringify(loaderData));
      expect(next).not.toHaveBeenCalled();
    });

    it('handles nested route paths', async () => {
      const loaderData = { postId: '123', title: 'Test Post' };
      mockExecuteRouteLoader.mockResolvedValue({ data: loaderData });

      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/posts/123',
          method: 'GET',
        },
        res,
        next
      );

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        new URL('/posts/123', mockDevServerUrl),
        expect.objectContaining({
          namedRegex: expect.any(RegExp),
        }),
        undefined
      );
      expect(res.end).toHaveBeenCalledWith(JSON.stringify(loaderData));
    });

    it('handles dynamic route segments', async () => {
      const loaderData = { dynamic: true };
      mockExecuteRouteLoader.mockResolvedValue({ data: loaderData });

      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/posts/[id]',
          method: 'GET',
        },
        res,
        next
      );

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        new URL('/posts/[id]', mockDevServerUrl),
        expect.objectContaining({
          namedRegex: expect.any(RegExp),
        }),
        undefined
      );
    });

    it('returns 404 when loader result is undefined', async () => {
      mockExecuteRouteLoader.mockResolvedValue(undefined);

      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/no-loader',
          method: 'GET',
        },
        res,
        next
      );

      expect(res.statusCode).toBe(404);
      expect(res.end).toHaveBeenCalledWith();
    });

    it('returns `null` for `null` loader data', async () => {
      mockExecuteRouteLoader.mockResolvedValue({ data: null });

      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/null-data',
          method: 'GET',
        },
        res,
        next
      );

      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledWith('null');
    });

    it('handles loader execution errors gracefully', async () => {
      const error = new Error('Loader failed');
      mockExecuteRouteLoader.mockRejectedValue(error);

      const originalConsoleError = console.error;
      console.error = jest.fn();

      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/error',
          method: 'GET',
        },
        res,
        next
      );

      expect(console.error).toHaveBeenCalledWith(
        'Failed to generate loader module for /_expo/loaders/error:',
        error
      );
      expect(res.statusCode).toBe(500);
      expect(res.end).toHaveBeenCalledWith();

      console.error = originalConsoleError;
    });

    it('handles special characters in loader data', async () => {
      const loaderData = {
        quotes: 'He said "Hello"',
        backslash: 'C:\\Users\\test',
        newline: 'Line 1\nLine 2',
        unicode: '你好世界 🌍',
        html: '<script>alert("xss")</script>',
      };
      mockExecuteRouteLoader.mockResolvedValue({ data: loaderData });

      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/special',
          method: 'GET',
        },
        res,
        next
      );

      const expectedOutput = JSON.stringify(loaderData);
      expect(res.end).toHaveBeenCalledWith(expectedOutput);

      expect(expectedOutput).toContain('\\"Hello\\"');
      expect(expectedOutput).toContain('\\\\Users\\\\test');
      expect(expectedOutput).toContain('\\n');
    });
  });

  it.each([
    { loaderPath: '/_expo/loaders/index', expectedRoute: '/' },
    { loaderPath: '/_expo/loaders/about', expectedRoute: '/about' },
    { loaderPath: '/_expo/loaders/posts/123', expectedRoute: '/posts/123' },
    { loaderPath: '/_expo/loaders/posts/[id]', expectedRoute: '/posts/[id]' },
  ])(
    'correctly converts loader path $loaderPath to route path $expectedRoute',
    async ({ loaderPath, expectedRoute }) => {
      mockExecuteRouteLoader.mockClear();
      mockExecuteRouteLoader.mockResolvedValue({ data: {} });

      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: loaderPath,
          method: 'GET',
        },
        res,
        next
      );

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        new URL(expectedRoute, mockDevServerUrl),
        expect.objectContaining({
          namedRegex: expect.any(RegExp),
        }),
        undefined
      );
    }
  );

  describe('SSG with `web.output: static`', () => {
    beforeEach(() => {
      (getConfig as jest.Mock).mockReturnValue({
        exp: {
          web: { output: 'static' },
          extra: {
            router: {
              unstable_useServerDataLoaders: true,
            },
          },
        },
      });

      middleware = new DataLoaderModuleMiddleware(
        mockProjectRoot,
        mockAppDir,
        mockExecuteRouteLoader,
        mockGetDevServerUrl
      );
    });

    it('does not pass `Request` object to loader', async () => {
      mockExecuteRouteLoader.mockResolvedValue({ data: {} });
      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/test',
          method: 'GET',
        },
        res,
        next
      );

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        expect.any(URL),
        expect.any(Object),
        undefined
      );
    });
  });

  describe('SSR with `web.output: server` and `useServerRendering: true`', () => {
    beforeEach(() => {
      (getConfig as jest.Mock).mockReturnValue({
        exp: {
          web: { output: 'server' },
          extra: {
            router: {
              unstable_useServerDataLoaders: true,
              unstable_useServerRendering: true,
            },
          },
        },
      });

      middleware = new DataLoaderModuleMiddleware(
        mockProjectRoot,
        mockAppDir,
        mockExecuteRouteLoader,
        mockGetDevServerUrl
      );
    });

    it('passes `Request` object to loader', async () => {
      mockExecuteRouteLoader.mockResolvedValue({ data: {} });
      const res = getMockRes();
      const next = jest.fn();

      await middleware.handleRequestAsync(
        {
          url: '/_expo/loaders/test',
          method: 'GET',
          rawHeaders: ['Accept', 'application/json', 'X-Custom-Header', 'custom-value'],
        },
        res,
        next
      );

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        expect.any(URL),
        expect.any(Object),
        expect.any(Request)
      );

      const passedRequest = mockExecuteRouteLoader.mock.calls[0][2] as Request;
      expect(passedRequest.url).toBe('http://localhost:8081/test');
      expect(passedRequest.method).toBe('GET');
      expect(passedRequest.headers.get('X-Custom-Header')).toBe('custom-value');
    });
  });
});
