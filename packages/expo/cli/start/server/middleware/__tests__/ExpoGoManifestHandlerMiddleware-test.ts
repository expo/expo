import { getProjectAsync } from '../../../../api/getProject';
import { signExpoGoManifestAsync } from '../../../../api/signManifest';
import { getUserAsync } from '../../../../api/user/user';
import { ProcessSettings } from '../../../ProcessSettings';
import { ExpoGoManifestHandlerMiddleware } from '../ExpoGoManifestHandlerMiddleware';
import { ServerRequest } from '../server.types';

jest.mock('../../../../api/getProject', () => ({
  getProjectAsync: jest.fn(() => ({
    scopeKey: 'scope-key',
  })),
}));

jest.mock('@expo/config-plugins', () => ({
  Updates: {
    getRuntimeVersion: jest.fn(() => '45.0.0'),
  },
}));

jest.mock('../../../../api/signManifest', () => ({
  signExpoGoManifestAsync: jest.fn((manifest) => JSON.stringify(manifest)),
}));
jest.mock('../../../../api/user/user');

jest.mock('../../../../log');

jest.mock('../resolveAssets', () => ({
  resolveManifestAssets: jest.fn(),
  resolveGoogleServicesFile: jest.fn(),
}));

jest.mock('../../../ProcessSettings', () => ({
  ProcessSettings: {
    isOffline: false,
  },
}));

jest.mock('../resolveEntryPoint', () => ({
  resolveEntryPoint: jest.fn(() => './index.js'),
}));

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
}));

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

beforeEach(() => {
  ProcessSettings.isOffline = false;
});

describe('getParsedHeaders', () => {
  const middleware = new ExpoGoManifestHandlerMiddleware('/', {} as any);

  // The classic manifest middleware did not assert.
  it('asserts platform is missing', () => {
    expect(() => middleware.getParsedHeaders(asReq({}))).toThrowError(
      /Must specify 'expo-platform' header or 'platform' query parameter/
    );
  });

  it('returns default values from headers', () => {
    expect(middleware.getParsedHeaders(asReq({ headers: { 'expo-platform': 'android' } }))).toEqual(
      {
        acceptSignature: false,
        hostname: undefined,
        platform: 'android',
      }
    );
  });

  it(`returns a fully qualified object`, () => {
    expect(
      middleware.getParsedHeaders(
        asReq({
          headers: {
            host: 'localhost:8081',
            'expo-platform': 'ios',
            // This is different to the classic manifest middleware.
            'expo-accept-signature': 'true',
          },
        })
      )
    ).toEqual({
      acceptSignature: true,
      hostname: 'localhost',
      // We don't care much about the platform here since it's already tested.
      platform: 'ios',
    });
  });
});

describe('_getManifestResponseAsync', () => {
  beforeEach(() => {
    ProcessSettings.isOffline = false;
    asMock(signExpoGoManifestAsync).mockClear();
    asMock(getUserAsync)
      .mockClear()
      .mockImplementation(async () => ({} as any));
  });

  function createMiddleware() {
    const middleware = new ExpoGoManifestHandlerMiddleware('/', {} as any);

    middleware._resolveProjectSettingsAsync = jest.fn(
      async () =>
        ({
          expoGoConfig: {},
          hostUri: 'https://localhost:8081',
          bundleUrl: 'https://localhost:8081/bundle.js',
          exp: {
            slug: 'slug',
            extra: {
              eas: {
                projectId: 'projectId',
              },
            },
          },
        } as any)
    );
    return middleware;
  }

  // Sanity
  it('returns an anon manifest', async () => {
    const middleware = createMiddleware();
    ProcessSettings.isOffline = true;
    const results = await middleware._getManifestResponseAsync({
      platform: 'android',
      acceptSignature: true,
      hostname: 'localhost',
    });
    expect(results.version).toBe('45.0.0');

    expect(results.headers).toEqual(
      new Map(
        Object.entries({
          'expo-protocol-version': 0,
          'expo-sfv-version': 0,
          'cache-control': 'private, max-age=0',
          'content-type': 'application/json',
        })
      )
    );

    expect(JSON.parse(results.body)).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      runtimeVersion: '45.0.0',
      launchAsset: {
        key: 'bundle',
        contentType: 'application/javascript',
        url: 'https://localhost:8081/bundle.js',
      },
      assets: [],
      metadata: {},
      extra: {
        eas: {
          projectId: 'projectId',
        },
        expoClient: {
          extra: {
            eas: {
              projectId: 'projectId',
            },
          },
          hostUri: 'https://localhost:8081',
          slug: 'slug',
        },
        expoGo: {},
        scopeKey: expect.stringMatching(/@anonymous\/.*/),
      },
    });
  });

  it('returns a signed manifest', async () => {
    asMock(getProjectAsync).mockClear();
    const middleware = createMiddleware();

    const results = await middleware._getManifestResponseAsync({
      platform: 'android',
      acceptSignature: true,
      hostname: 'localhost',
    });
    expect(results.version).toBe('45.0.0');
    expect(results.headers.get('expo-manifest-signature')).toEqual(expect.any(String));

    expect(JSON.parse(results.body)).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      runtimeVersion: '45.0.0',
      launchAsset: {
        key: 'bundle',
        contentType: 'application/javascript',
        url: 'https://localhost:8081/bundle.js',
      },
      assets: [],
      metadata: {},
      extra: {
        eas: {
          projectId: 'projectId',
        },
        expoClient: expect.anything(),
        expoGo: {},
        scopeKey: expect.not.stringMatching(/@anonymous\/.*/),
      },
    });
    expect(getProjectAsync).toBeCalledTimes(1);

    // Test memoization on API calls...
    await middleware._getManifestResponseAsync({
      platform: 'android',
      acceptSignature: true,
      hostname: 'localhost',
    });

    expect(getProjectAsync).toBeCalledTimes(1);
  });
});
