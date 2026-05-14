import {
  OpenActionResult,
  OpenHostSupportEntry,
  OpenInfoResult,
  OpenMiddleware,
  OpenMiddlewareOptions,
  OpenPlatformInfo,
  OpenRequestedRuntime,
  OpenSinglePlatformResult,
} from '../OpenMiddleware';
import type { ServerRequest, ServerResponse } from '../server.types';

const localSocket = {
  localAddress: '127.0.0.1',
  remoteAddress: '127.0.0.1',
  remoteFamily: 'IPv4',
} as unknown as ServerRequest['socket'];

const remoteSocket = {
  localAddress: '192.168.1.10',
  remoteAddress: '192.168.1.42',
  remoteFamily: 'IPv4',
} as unknown as ServerRequest['socket'];

const asReq = (req: Partial<ServerRequest>) => ({ socket: localSocket, ...req }) as ServerRequest;

const fullSupport: OpenHostSupportEntry = { canOpen: true };
const iosBlocked: OpenHostSupportEntry = {
  canOpen: false,
  reason: 'iOS simulators require macOS with Xcode installed; this dev server is running on linux.',
};

function createMockResponse() {
  return {
    setHeader: jest.fn(),
    end: jest.fn(),
    statusCode: 0,
  } as unknown as ServerResponse;
}

function singleResult(overrides: Partial<OpenSinglePlatformResult> = {}): OpenSinglePlatformResult {
  return {
    runtime: 'expo',
    url: 'exp://127.0.0.1:8081',
    scheme: 'myapp',
    availableRuntimes: ['expo', 'custom'],
    appId: 'com.example.app',
    ...overrides,
  };
}

type GetInfoMock = jest.Mock<
  Promise<OpenInfoResult>,
  [{ platform: any; runtime: OpenRequestedRuntime }]
>;

function createMiddleware(overrides: Partial<OpenMiddlewareOptions> = {}): {
  middleware: OpenMiddleware;
  getInfo: GetInfoMock;
  open: jest.Mock<Promise<OpenActionResult>, [{ platform: any }]>;
  getHostSupport: jest.Mock<OpenHostSupportEntry, [any]>;
} {
  const getInfo =
    (overrides.getInfo as GetInfoMock) ??
    (jest.fn(async ({ runtime }) =>
      singleResult({
        runtime: runtime === 'default' ? 'expo' : runtime,
      })
    ) as GetInfoMock);
  const open =
    (overrides.open as jest.Mock<Promise<OpenActionResult>, [{ platform: any }]>) ??
    jest.fn(async ({ platform }) => ({ platform, runtime: 'expo' as const, url: 'exp://opened' }));
  const getHostSupport =
    (overrides.getHostSupport as jest.Mock<OpenHostSupportEntry, [any]>) ??
    jest.fn(() => fullSupport);
  const middleware = new OpenMiddleware('/', { getInfo, open, getHostSupport });
  return { middleware, getInfo, open, getHostSupport };
}

describe('shouldHandleRequest', () => {
  const { middleware } = createMiddleware();

  it('matches /_expo/open', () => {
    expect(middleware.shouldHandleRequest(asReq({ url: 'http://localhost:8081/_expo/open' }))).toBe(
      true
    );
    expect(
      middleware.shouldHandleRequest(
        asReq({ url: 'http://localhost:8081/_expo/open?platform=ios' })
      )
    ).toBe(true);
  });

  it('rejects other paths', () => {
    for (const url of [
      'http://localhost:8081',
      'http://localhost:8081/',
      'http://localhost:8081/_expo/link',
    ]) {
      expect(middleware.shouldHandleRequest(asReq({ url }))).toBe(false);
    }
  });
});

describe('GET /_expo/open with platform', () => {
  it('returns focused single-platform info', async () => {
    const { middleware, getInfo } = createMiddleware();
    const res = createMockResponse();

    await middleware.handleRequestAsync(
      asReq({ url: 'http://localhost:8081/_expo/open?platform=ios', method: 'GET', headers: {} }),
      res
    );

    expect(getInfo).toHaveBeenCalledWith({ platform: 'ios', runtime: 'default' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body).toEqual({
      runtime: 'expo',
      url: 'exp://127.0.0.1:8081',
      scheme: 'myapp',
      availableRuntimes: ['expo', 'custom'],
      appId: 'com.example.app',
    });
  });

  it('runtime defaults to "default" when omitted', async () => {
    const { middleware, getInfo } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({ url: 'http://localhost:8081/_expo/open?platform=ios', method: 'GET', headers: {} }),
      res
    );
    expect(getInfo).toHaveBeenCalledWith({ platform: 'ios', runtime: 'default' });
  });

  it('forwards an explicit runtime', async () => {
    const { middleware, getInfo } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios&runtime=custom',
        method: 'GET',
        headers: {},
      }),
      res
    );
    expect(getInfo).toHaveBeenCalledWith({ platform: 'ios', runtime: 'custom' });
  });

  it('omits runtime when the URL is the disambiguation page', async () => {
    const disambiguation: OpenPlatformInfo = {
      url: 'http://127.0.0.1:8081/_expo/loading?platform=ios',
      appId: 'com.example.app',
    };
    const { middleware } = createMiddleware({
      getInfo: jest.fn(async () => ({
        scheme: 'myapp',
        availableRuntimes: ['expo', 'custom'],
        ...disambiguation,
      })),
    });
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({ url: 'http://localhost:8081/_expo/open?platform=ios', method: 'GET', headers: {} }),
      res
    );
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body.runtime).toBeUndefined();
    expect(Object.hasOwn(body, 'runtime')).toBe(false);
    expect(body.url).toMatch(/_expo\/loading/);
    expect(body.availableRuntimes).toEqual(['expo', 'custom']);
  });

  it('400s on unsupported runtime', async () => {
    const { middleware } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios&runtime=bogus',
        method: 'GET',
        headers: {},
      }),
      res
    );
    expect(res.statusCode).toBe(400);
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body.error).toMatch(/Must be "default", "expo", "custom", or "unknown"/);
  });

  it('400s on unsupported platform', async () => {
    const { middleware } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({ url: 'http://localhost:8081/_expo/open?platform=tv', method: 'GET', headers: {} }),
      res
    );
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /_expo/open without platform (discovery)', () => {
  it('returns a per-platform map plus project metadata', async () => {
    const { middleware, getInfo } = createMiddleware({
      getInfo: jest.fn(async () => ({
        scheme: 'myapp',
        availableRuntimes: ['expo', 'custom'],
        platforms: {
          // ios & android omit `runtime` because the URL is the disambiguation page
          ios: {
            url: 'http://127.0.0.1:8081/_expo/loading?platform=ios',
            appId: 'com.example.ios',
          },
          android: {
            url: 'http://127.0.0.1:8081/_expo/loading?platform=android',
            appId: 'com.example.android',
          },
          web: { runtime: 'web', url: 'http://127.0.0.1:8081', appId: null },
        },
      })),
    });
    const res = createMockResponse();

    await middleware.handleRequestAsync(
      asReq({ url: 'http://localhost:8081/_expo/open', method: 'GET', headers: {} }),
      res
    );

    expect(getInfo).toHaveBeenCalledWith({ platform: null, runtime: 'default' });
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body.scheme).toBe('myapp');
    expect(body.availableRuntimes).toEqual(['expo', 'custom']);
    expect(Object.keys(body.platforms)).toEqual(['ios', 'android', 'web']);
    expect(body.platforms.ios.runtime).toBeUndefined();
    expect(body.platforms.web.runtime).toBe('web');
  });
});

describe('POST /_expo/open', () => {
  it('calls open() and returns the action result', async () => {
    const { middleware, open } = createMiddleware();
    const res = createMockResponse();

    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios',
        method: 'POST',
        headers: { host: 'localhost:8081' },
      }),
      res
    );

    expect(open).toHaveBeenCalledWith({ platform: 'ios' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body).toEqual({ platform: 'ios', runtime: 'expo', url: 'exp://opened' });
  });

  it('400s when no platform is provided', async () => {
    const { middleware, open } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({ url: 'http://localhost:8081/_expo/open', method: 'POST', headers: {} }),
      res
    );
    expect(open).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});

describe('POST same-device enforcement', () => {
  it('403s POST from a non-loopback socket', async () => {
    const { middleware, open } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios',
        method: 'POST',
        headers: { host: 'localhost:8081' },
        socket: remoteSocket,
      }),
      res
    );
    expect(open).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body.code).toBe('REMOTE_DEVICE_FORBIDDEN');
  });

  it('allows POST from an IPv6 loopback socket', async () => {
    const { middleware, open } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios',
        method: 'POST',
        headers: { host: 'localhost:8081' },
        socket: {
          localAddress: '::1',
          remoteAddress: '::1',
          remoteFamily: 'IPv6',
        } as unknown as ServerRequest['socket'],
      }),
      res
    );
    expect(open).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('does not enforce same-device on GET (LAN devices need to fetch deep links)', async () => {
    const { middleware, getInfo } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios',
        method: 'GET',
        headers: { host: '192.168.1.10:8081' },
        socket: remoteSocket,
      }),
      res
    );
    expect(getInfo).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});

describe('POST same-origin enforcement', () => {
  it('allows POST when no Origin header is set', async () => {
    const { middleware, open } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios',
        method: 'POST',
        headers: { host: 'localhost:8081' },
      }),
      res
    );
    expect(open).toHaveBeenCalled();
  });

  it('403s POST from a different origin', async () => {
    const { middleware, open } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios',
        method: 'POST',
        headers: { host: 'localhost:8081', origin: 'https://malicious.example.com' },
      }),
      res
    );
    expect(open).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body.code).toBe('CROSS_ORIGIN_FORBIDDEN');
  });

  it('does not enforce same-origin on GET (tunnels)', async () => {
    const { middleware, getInfo } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios',
        method: 'GET',
        headers: { host: 'localhost:8081', origin: 'https://my-tunnel.example.com' },
      }),
      res
    );
    expect(getInfo).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});

describe('host platform support', () => {
  it('501s POST when the host cannot open the platform', async () => {
    const { middleware, open } = createMiddleware({
      getHostSupport: jest.fn((p) => (p === 'ios' ? iosBlocked : fullSupport)),
    });
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=ios',
        method: 'POST',
        headers: { host: 'localhost:8081' },
      }),
      res
    );
    expect(open).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(501);
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body.code).toBe('HOST_CANNOT_OPEN_PLATFORM');
    expect(body.details).toMatch(/linux/);
    expect(body.details).toMatch(/remote preview service/);
  });

  it('500s POST when open() throws, carrying the underlying code', async () => {
    const { middleware } = createMiddleware({
      open: jest.fn(async () => {
        const err: any = new Error('xcrun simctl is not available');
        err.code = 'SIMCTL';
        throw err;
      }),
    });
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/open?platform=android',
        method: 'POST',
        headers: { host: 'localhost:8081' },
      }),
      res
    );
    expect(res.statusCode).toBe(500);
    const body = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(body.code).toBe('SIMCTL');
    expect(body.details).toMatch(/xcrun simctl/);
  });
});

describe('unsupported methods', () => {
  it('405s on PUT', async () => {
    const { middleware } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({ url: 'http://localhost:8081/_expo/open?platform=ios', method: 'PUT', headers: {} }),
      res
    );
    expect(res.statusCode).toBe(405);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET, HEAD, POST');
  });
});
