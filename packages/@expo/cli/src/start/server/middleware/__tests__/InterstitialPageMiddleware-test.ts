import { getConfig, getNameFromConfig } from '@expo/config';
import { getRuntimeVersionNullable } from '@expo/config-plugins/build/utils/Updates';
import { vol } from 'memfs';

import { asMock } from '../../../../__tests__/asMock';
import { InterstitialPageMiddleware } from '../InterstitialPageMiddleware';
import { ServerRequest, ServerResponse } from '../server.types';

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

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

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

describe('_shouldHandleRequest', () => {
  const middleware = new InterstitialPageMiddleware('/');
  it(`returns false when the middleware should not handle`, () => {
    for (const req of [
      asReq({}),
      asReq({ url: 'http://localhost:19000' }),
      asReq({ url: 'http://localhost:19000/' }),
    ]) {
      expect(middleware._shouldHandleRequest(req)).toBe(false);
    }
  });
  it(`returns true when the middleware should handle`, () => {
    for (const req of [asReq({ url: 'http://localhost:19000/_expo/loading' })]) {
      expect(middleware._shouldHandleRequest(req)).toBe(true);
    }
  });
});

describe('_getProjectOptions', () => {
  it('returns the project settings from the config', async () => {
    asMock(getNameFromConfig).mockReturnValueOnce({ appName: 'my-app' });
    asMock(getRuntimeVersionNullable).mockReturnValueOnce('123');

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

    await middleware.handleRequestAsync(
      asReq({ url: 'http://localhost:3000', headers: { 'expo-platform': 'ios' } }),
      response
    );
    expect(response.statusCode).toBe(200);
    expect(response.end).toBeCalledWith('mock-value');
    expect(response.setHeader).toHaveBeenNthCalledWith(
      1,
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );
    expect(response.setHeader).toHaveBeenNthCalledWith(2, 'Expires', '-1');
    expect(response.setHeader).toHaveBeenNthCalledWith(3, 'Pragma', 'no-cache');
    expect(response.setHeader).toHaveBeenNthCalledWith(4, 'Content-Type', 'text/html');
  });
});
