import { getConfig, getNameFromConfig } from '@expo/config';
import { getRuntimeVersionNullable } from '@expo/config-plugins/build/utils/Updates';
import { vol } from 'memfs';

import { InterstitialPageMiddleware } from '../InterstitialPageMiddleware';
import { ServerRequest, ServerResponse } from '../server.types';

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('@expo/config', () => ({
  getProjectConfigDescriptionWithPaths: jest.fn(),
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
  getNameFromConfig: jest.fn(() => 'my-app'),
}));

jest.mock('@expo/config-plugins/build/utils/Updates', () => ({
  getRuntimeVersionNullable: jest.fn(),
}));

const originalCwd = process.cwd();

beforeAll(() => {
  process.chdir('/');
});
beforeEach(() => {
  vol.reset();
});

afterAll(() => {
  process.chdir(originalCwd);
});

describe('_shouldContinue', () => {
  const middleware = new InterstitialPageMiddleware('/');
  it(`returns false when the middleware should not handle`, () => {
    for (const req of [
      asReq({}),
      asReq({ url: 'http://localhost:19000' }),
      asReq({ url: 'http://localhost:19000/' }),
    ]) {
      expect(middleware._shouldContinue(req)).toBe(false);
    }
  });
  it(`returns true when the middleware should handle`, () => {
    for (const req of [asReq({ url: 'http://localhost:19000/_expo/loading' })]) {
      expect(middleware._shouldContinue(req)).toBe(true);
    }
  });
});

describe('_getProjectOptions', () => {
  it('returns the project settings from the config', async () => {
    asMock(getNameFromConfig).mockClear().mockReturnValueOnce({ appName: 'my-app' });
    asMock(getConfig).mockClear();
    asMock(getRuntimeVersionNullable).mockClear().mockReturnValueOnce('123');

    const middleware = new InterstitialPageMiddleware('/');

    expect(middleware._getProjectOptions('ios')).toEqual({
      runtimeVersion: '123',
      appName: 'my-app',
    });
    expect(getConfig).toBeCalled();
    expect(getRuntimeVersionNullable).toBeCalledWith(
      { name: 'my-app', sdkVersion: '45.0.0', slug: 'my-app' },
      'ios'
    );
  });
});

describe('_getPageAsync', () => {
  it('returns the static HTML with templates filled in', async () => {
    const projectRoot = '/';
    vol.fromJSON(
      {
        'node_modules/expo/static/loading-page/index.html':
          'AppName: "{{ AppName }}", RuntimeVersion "{{ RuntimeVersion }}", Path: {{ Path }}',
      },
      projectRoot
    );

    const middleware = new InterstitialPageMiddleware(projectRoot);
    await expect(
      middleware._getPageAsync({
        appName: 'App',
        runtimeVersion: '123',
      })
    ).resolves.toEqual('AppName: "App", RuntimeVersion "123", Path: /');
  });
});

describe('handleRequestAsync', () => {
  it('returns the interstitial page', async () => {
    const middleware = new InterstitialPageMiddleware('/');

    middleware._getProjectOptions = jest.fn(() => ({
      runtimeVersion: '123',
      appName: 'App',
    }));

    middleware._getPageAsync = jest.fn(async () => 'mock-value');

    const response = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    } as unknown as ServerResponse;

    await middleware.handleRequestAsync(asReq({}), response);
    expect(response.statusCode).toBe(200);
    expect(response.end).toBeCalledWith('mock-value');
    expect(response.setHeader).toBeCalledTimes(4);
  });
});
