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

const asRequest = (req: Partial<ServerRequest>) => {
  return {
    headers: {
      accept: 'application/json',
    },
    ...req,
  } as ServerRequest;
};

function getMockRes() {
  return {
    end: jest.fn(),
    setHeader: jest.fn(),
    statusCode: 200,
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

      const req = asRequest({
        url: '/_expo/loaders/index',
      });

      expect(middleware.shouldHandleRequest(req)).toBe(false);
    });

    it.each(['/_expo/loaders/index', '/_expo/loaders/posts/[id]'])(
      'should return true for valid loader path %s',
      (url) => {
        const req = asRequest({ url });

        expect(middleware.shouldHandleRequest(req)).toBe(true);
      }
    );

    it.each(['/', '/api/data', '/_expo/other', '/expo/loaders/index', '/_expo', '/_expo/'])(
      'returns false for non-loader path %s',
      (url) => {
        const req = asRequest({ url });
        expect(middleware.shouldHandleRequest(req)).toBe(false);
      }
    );

    it('returns false when config is missing', () => {
      (getConfig as jest.Mock).mockReturnValue({
        exp: {},
      });

      const req = asRequest({
        url: '/_expo/loaders/index',
      });

      expect(middleware.shouldHandleRequest(req)).toBe(false);
    });
  });

  describe('handleRequestAsync()', () => {
    it('generates a loader module', async () => {
      const loaderData = { foo: 'bar', count: 42 };
      mockExecuteRouteLoader.mockResolvedValue(loaderData);

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/index',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        new URL('/', mockDevServerUrl),
        expect.objectContaining({
          namedRegex: expect.any(RegExp),
        })
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/javascript; charset=utf-8'
      );
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledWith(JSON.stringify(loaderData));
      expect(next).not.toHaveBeenCalled();
    });

    it('handles nested route paths', async () => {
      const loaderData = { postId: '123', title: 'Test Post' };
      mockExecuteRouteLoader.mockResolvedValue(loaderData);

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/posts/123',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        new URL('/posts/123', mockDevServerUrl),
        expect.objectContaining({
          namedRegex: expect.any(RegExp),
        })
      );
      expect(res.end).toHaveBeenCalledWith(JSON.stringify(loaderData));
    });

    it('handles dynamic route segments', async () => {
      const loaderData = { dynamic: true };
      mockExecuteRouteLoader.mockResolvedValue(loaderData);

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/posts/[id]',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        new URL('/posts/[id]', mockDevServerUrl),
        expect.objectContaining({
          namedRegex: expect.any(RegExp),
        })
      );
    });

    it.each([null, undefined])('handles nullish loader data', async (value) => {
      mockExecuteRouteLoader.mockResolvedValue(value);

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/null-data',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledWith('{}');
    });

    it('handles loader execution errors gracefully', async () => {
      const error = new Error('Loader failed');
      mockExecuteRouteLoader.mockRejectedValue(error);

      const originalConsoleError = console.error;
      console.error = jest.fn();

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/error',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to generate loader module for /_expo/loaders/error:',
        error
      );
      expect(res.statusCode).toBe(500);
      expect(res.end).toHaveBeenCalledWith('{}');

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
      mockExecuteRouteLoader.mockResolvedValue(loaderData);

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/special',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

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
      mockExecuteRouteLoader.mockResolvedValue({});

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: loaderPath,
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(
        new URL(expectedRoute, mockDevServerUrl),
        expect.objectContaining({
          namedRegex: expect.any(RegExp),
        })
      );
    }
  );
});
