import { createRouteHandlerMiddleware } from '../createServerRouteMiddleware';
import { warnInvalidMiddlewareMatcherSettings } from '../router';

jest.mock('resolve-from', () => ({
  silent: jest.fn(() => '/path/to/expo-router'),
}));
jest.mock('expo-server/adapter/http', () => ({
  createRequestHandler: jest.fn((build, options) => {
    return {
      _options: options,
      _build: build,
    };
  }),
}));

describe(createRouteHandlerMiddleware, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('headers', () => {
    it('applies custom headers via beforeResponse', async () => {
      const mockConfig = {} as any;
      const headers = {
        'X-Powered-By': 'expo-dev',
        'Set-Cookie': ['hello=world', 'foo=bar'],
        'Content-Type': 'application/pdf',
      };

      const handler = createRouteHandlerMiddleware('/test/project', {
        appDir: 'app',
        routerRoot: '.',
        getStaticPageAsync: jest.fn(),
        bundleApiRoute: jest.fn(),
        config: mockConfig,
        headers,
      });

      const responseInit = { headers: new Headers({ 'Content-Type': 'text/html' }) };
      const result = (handler as any)._options.beforeResponse(responseInit, {});

      // Check that existing content-type header is not overridden
      expect(result.headers.get('Content-Type')).toBe('text/html');

      // Check single-value custom header
      expect(result.headers.get('X-Powered-By')).toBe('expo-dev');

      // Check array-value custom headers
      expect(result.headers.get('Set-Cookie')).toBe('hello=world, foo=bar');
    });
  });
});

describe(warnInvalidMiddlewareMatcherSettings, () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('methods', () => {
    it('logs if methods is not an array', () => {
      const matcher = {
        methods: {},
      };
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
      };
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
