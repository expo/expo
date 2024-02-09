import { RuntimeRedirectMiddleware } from '../RuntimeRedirectMiddleware';
import { ServerRequest, ServerResponse } from '../server.types';

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

function createMiddleware() {
  const getLocation = jest.fn(({ runtime }) =>
    runtime === 'custom' ? 'mock-location-custom' : 'mock-location-expo'
  );
  const onDeepLink = jest.fn();
  const middleware = new RuntimeRedirectMiddleware('/', {
    getLocation,
    onDeepLink,
  });

  return { middleware, getLocation, onDeepLink };
}

function createMockResponse() {
  return {
    setHeader: jest.fn(),
    end: jest.fn(),
    statusCode: 200,
  } as unknown as ServerResponse;
}

describe('shouldHandleRequest', () => {
  const { middleware } = createMiddleware();
  it(`returns false when the middleware should not handle`, () => {
    for (const req of [
      asReq({}),
      asReq({ url: 'http://localhost:8081' }),
      asReq({ url: 'http://localhost:8081/' }),
    ]) {
      expect(middleware.shouldHandleRequest(req)).toBe(false);
    }
  });
  it(`returns true when the middleware should handle`, () => {
    for (const req of [asReq({ url: 'http://localhost:8081/_expo/link' })]) {
      expect(middleware.shouldHandleRequest(req)).toBe(true);
    }
  });
});

describe('handleRequestAsync', () => {
  it('redirects to Expo Go', async () => {
    const { middleware, getLocation, onDeepLink } = createMiddleware();

    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/link',
        headers: { 'expo-platform': 'android' },
      }),
      response
    );
    expect(response.statusCode).toBe(307);
    expect(response.end).toBeCalledWith();
    expect(response.setHeader).toBeCalledTimes(4);
    expect(response.setHeader).toHaveBeenNthCalledWith(1, 'Location', 'mock-location-expo');
    expect(getLocation).toBeCalledWith({ runtime: 'expo' });
    expect(onDeepLink).toBeCalledWith({ runtime: 'expo', platform: 'android' });
  });

  it('redirects to Expo Go with user agent header', async () => {
    const { middleware, getLocation, onDeepLink } = createMiddleware();

    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/link',
        headers: {
          'user-agent':
            'Mozilla/5.0 (Linux; Android 11; Pixel 2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Mobile Safari/537.36',
        },
      }),
      response
    );
    expect(response.statusCode).toBe(307);
    expect(response.end).toBeCalledWith();
    expect(response.setHeader).toBeCalledTimes(4);
    expect(response.setHeader).toHaveBeenNthCalledWith(1, 'Location', 'mock-location-expo');
    expect(getLocation).toBeCalledWith({ runtime: 'expo' });
    expect(onDeepLink).toBeCalledWith({ runtime: 'expo', platform: 'android' });
  });

  it('redirects to a custom runtime', async () => {
    const { middleware, getLocation, onDeepLink } = createMiddleware();

    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/link?choice=expo-dev-client&platform=ios',
      }),
      response
    );
    expect(response.statusCode).toBe(307);
    expect(response.end).toBeCalledWith();
    expect(response.setHeader).toBeCalledTimes(4);
    expect(response.setHeader).toHaveBeenNthCalledWith(1, 'Location', 'mock-location-custom');
    expect(getLocation).toBeCalledWith({ runtime: 'custom' });
    expect(onDeepLink).toBeCalledWith({ runtime: 'custom', platform: 'ios' });
  });
});
