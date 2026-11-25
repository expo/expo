import { createDebugMiddleware } from '../createDebugMiddleware';

jest.mock('../../../../../utils/env', () => ({
  ...jest.requireActual('../../../../../utils/env'),
  envIsHeadless: () => true,
}));

jest.mock('../../../../../utils/net', () => ({
  ...jest.requireActual('../../../../../utils/net'),
  shouldThrottleRemoteDevCall: jest.fn(() => false),
}));

jest.mock('@react-native/dev-middleware', () => ({
  createDevMiddleware: jest.fn(() => ({
    middleware: jest.fn(),
    websocketEndpoints: {
      '/inspector/debug': { on: jest.fn() },
    },
  })),
}));

const { createDevMiddleware } = jest.requireMock('@react-native/dev-middleware') as {
  createDevMiddleware: jest.Mock;
};
const { shouldThrottleRemoteDevCall } = jest.requireMock('../../../../../utils/net') as {
  shouldThrottleRemoteDevCall: jest.Mock;
};

function experiments() {
  return createDevMiddleware.mock.calls.at(-1)?.[0].unstable_experiments;
}

beforeEach(() => {
  delete process.env.EXPO_UNSTABLE_CORE_NETWORK_INSPECTOR;
  createDevMiddleware.mockClear();
  shouldThrottleRemoteDevCall.mockClear();
});

it('enables the Expo Network panel query param by default', () => {
  createDebugMiddleware({ serverBaseUrl: 'http://127.0.0.1:8081', reporter: {} as any });

  expect(experiments().enableNetworkInspector).toBe(true);
});

it('drops the Expo Network panel query param when using core network inspection', () => {
  process.env.EXPO_UNSTABLE_CORE_NETWORK_INSPECTOR = '1';
  createDebugMiddleware({ serverBaseUrl: 'http://127.0.0.1:8081', reporter: {} as any });

  expect(experiments().enableNetworkInspector).toBe(false);
});

describe('requests from another machine', () => {
  const serverBaseUrl = 'http://192.168.1.20:8081';

  function handleRemoteRequest(method: string, url: string, headers: Record<string, string> = {}) {
    const { debugMiddleware } = createDebugMiddleware({ serverBaseUrl, reporter: {} as any });
    const devMiddleware = createDevMiddleware.mock.results.at(-1)?.value.middleware as jest.Mock;
    const req = {
      method,
      url,
      headers,
      socket: { localAddress: '192.168.1.20', remoteAddress: '192.168.1.30', remoteFamily: 'IPv4' },
    };
    const res = { writeHead: jest.fn(), end: jest.fn() };
    res.writeHead.mockReturnValue(res);
    const next = jest.fn();
    debugMiddleware(req as any, res as any, next);
    return { devMiddleware, res, next };
  }

  it('launches React Native DevTools from a device on the network', () => {
    const { devMiddleware, next } = handleRemoteRequest('POST', '/open-debugger?device=abc');

    expect(devMiddleware).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a launch from a mismatched origin', () => {
    const { devMiddleware, res } = handleRemoteRequest('POST', '/open-debugger?device=abc', {
      origin: 'http://evil.example.com',
    });

    expect(res.writeHead).toHaveBeenCalledWith(403);
    expect(devMiddleware).not.toHaveBeenCalled();
  });

  it('throttles repeated launches', () => {
    shouldThrottleRemoteDevCall.mockReturnValueOnce(true);
    const { devMiddleware, res } = handleRemoteRequest('POST', '/open-debugger?device=abc');

    expect(res.writeHead).toHaveBeenCalledWith(429);
    expect(devMiddleware).not.toHaveBeenCalled();
  });
});
