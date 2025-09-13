import { getConfig } from '@expo/config';

import { DataLoaderModuleMiddleware } from '../DataLoaderModuleMiddleware';
import { ServerRequest, ServerResponse } from '../server.types';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(),
}));

const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

function getMockRes() {
  return {
    end: jest.fn(),
    setHeader: jest.fn(),
    statusCode: 200,
  } as unknown as ServerResponse;
}

describe(DataLoaderModuleMiddleware, () => {
  const mockProjectRoot = '/project';
  const mockDevServerUrl = 'http://localhost:8081';
  const mockExecuteRouteLoader = jest.fn();
  const mockGetDevServerUrl = jest.fn(() => mockDevServerUrl);

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

    middleware = new DataLoaderModuleMiddleware(
      mockProjectRoot,
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
        url: '/_expo/loaders/index.js',
      });

      expect(middleware.shouldHandleRequest(req)).toBe(false);
    });

    it.each(['/_expo/loaders/index.js', '/_expo/loaders/posts/[id].js'])(
      'should return true for valid loader path %s',
      (url) => {
        const req = asRequest({ url });

        expect(middleware.shouldHandleRequest(req)).toBe(true);
      }
    );

    it.each(['/', '/api/data', '/_expo/other', '/expo/loaders/index.js', '/_expo', '/_expo/'])(
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
        url: '/_expo/loaders/index.js',
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
        url: '/_expo/loaders/index.js',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(new URL('/', mockDevServerUrl));
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/javascript; charset=utf-8'
      );
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledWith(`export default ${JSON.stringify(loaderData)}`);
      expect(next).not.toHaveBeenCalled();
    });

    it('handles nested route paths', async () => {
      const loaderData = { postId: '123', title: 'Test Post' };
      mockExecuteRouteLoader.mockResolvedValue(loaderData);

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/posts/123.js',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(new URL('/posts/123', mockDevServerUrl));
      expect(res.end).toHaveBeenCalledWith(`export default ${JSON.stringify(loaderData)}`);
    });

    it('handles dynamic route segments', async () => {
      const loaderData = { dynamic: true };
      mockExecuteRouteLoader.mockResolvedValue(loaderData);

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/posts/[id].js',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(new URL('/posts/[id]', mockDevServerUrl));
    });

    it.each([null, undefined])('handles nullish loader data', async (value) => {
      mockExecuteRouteLoader.mockResolvedValue(value);

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/null-data.js',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledWith('export default {}');
    });

    it('handles loader execution errors gracefully', async () => {
      const error = new Error('Loader failed');
      mockExecuteRouteLoader.mockRejectedValue(error);

      const originalConsoleError = console.error;
      console.error = jest.fn();

      const res = getMockRes();
      const next = jest.fn();
      const req = asRequest({
        url: '/_expo/loaders/error.js',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to generate loader module for /_expo/loaders/error.js:',
        error
      );
      expect(res.statusCode).toBe(500);
      expect(res.end).toHaveBeenCalledWith('export default {}');

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
        url: '/_expo/loaders/special.js',
        method: 'GET',
      });

      await middleware.handleRequestAsync(req, res, next);

      const expectedOutput = `export default ${JSON.stringify(loaderData)}`;
      expect(res.end).toHaveBeenCalledWith(expectedOutput);

      expect(expectedOutput).toContain('\\"Hello\\"');
      expect(expectedOutput).toContain('\\\\Users\\\\test');
      expect(expectedOutput).toContain('\\n');
    });
  });

  it.each([
    { loaderPath: '/_expo/loaders/index.js', expectedRoute: '/' },
    { loaderPath: '/_expo/loaders/about.js', expectedRoute: '/about' },
    { loaderPath: '/_expo/loaders/posts/123.js', expectedRoute: '/posts/123' },
    { loaderPath: '/_expo/loaders/posts/[id].js', expectedRoute: '/posts/[id]' },
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

      expect(mockExecuteRouteLoader).toHaveBeenCalledWith(new URL(expectedRoute, mockDevServerUrl));
    }
  );
});
