import Dicer from 'dicer';
import nullthrows from 'nullthrows';
import { Stream } from 'stream';
import { parseItem } from 'structured-headers';

import { getProjectAsync } from '../../../../api/getProject';
import { APISettings } from '../../../../api/settings';
import { getUserAsync } from '../../../../api/user/user';
import { ExpoGoManifestHandlerMiddleware } from '../ExpoGoManifestHandlerMiddleware';
import { ServerHeaders, ServerRequest } from '../server.types';

jest.mock('../../../../api/user/user');
jest.mock('../../../../log');
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
jest.mock('../resolveAssets', () => ({
  resolveManifestAssets: jest.fn(),
  resolveGoogleServicesFile: jest.fn(),
}));
jest.mock('../../../../api/settings', () => ({
  APISettings: {
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

type MultipartPart = { headers: Map<string, string>; body: string };

function isManifestMultipartPart(multipartPart: MultipartPart): boolean {
  const [, parameters] = parseItem(nullthrows(multipartPart.headers.get('content-disposition')));
  const partName = parameters.get('name');
  return partName === 'manifest';
}

export async function getManifestBodyAsync(response: {
  body: string;
  headers: ServerHeaders;
}): Promise<string | null> {
  const multipartParts = await parseMultipartMixedResponseAsync(response);
  const manifestPart = multipartParts.find(isManifestMultipartPart);
  return manifestPart?.body ?? null;
}

async function parseMultipartMixedResponseAsync({
  body,
  headers,
}: {
  body: string;
  headers: ServerHeaders;
}): Promise<MultipartPart[]> {
  const contentType = headers.get('content-type');
  if (!contentType || typeof contentType != 'string') {
    throw new Error('The multipart manifest response is missing the content-type header');
  }

  const boundaryRegex = /^multipart\/.+?; boundary=(?:"([^"]+)"|([^\s;]+))/i;
  const matches = boundaryRegex.exec(contentType);
  if (!matches) {
    throw new Error('The content-type header in the HTTP response is not a multipart media type');
  }
  const boundary = matches[1] ?? matches[2];

  const bufferStream = new Stream.PassThrough();
  bufferStream.end(body);

  return await new Promise((resolve, reject) => {
    const parts: MultipartPart[] = [];
    bufferStream.pipe(
      new Dicer({ boundary })
        .on('part', (p) => {
          const part: MultipartPart = {
            body: '',
            headers: new Map(),
          };

          p.on('header', (headers) => {
            for (const h in headers) {
              part.headers.set(h, (headers as { [key: string]: string[] })[h][0]);
            }
          });
          p.on('data', (data) => {
            part.body += data.toString();
          });
          p.on('end', () => {
            parts.push(part);
          });
        })
        .on('finish', () => {
          resolve(parts);
        })
        .on('error', (error) => {
          reject(error);
        })
    );
  });
}

describe('getParsedHeaders', () => {
  const middleware = new ExpoGoManifestHandlerMiddleware('/', {} as any);

  // The classic manifest middleware did not assert.
  it('asserts platform is missing', () => {
    expect(() =>
      middleware.getParsedHeaders(
        asReq({
          url: 'http://localhost:3000',
          headers: {},
        })
      )
    ).toThrowError(/Must specify "expo-platform" header or "platform" query parameter/);
  });

  it('returns default values from headers', () => {
    expect(
      middleware.getParsedHeaders(
        asReq({ url: 'http://localhost:3000', headers: { 'expo-platform': 'android' } })
      )
    ).toEqual({
      explicitlyPrefersMultipartMixed: false,
      acceptSignature: false,
      hostname: null,
      platform: 'android',
    });
  });

  it(`returns a fully qualified object`, () => {
    expect(
      middleware.getParsedHeaders(
        asReq({
          url: 'http://localhost:3000',
          headers: {
            accept: 'multipart/mixed',
            host: 'localhost:8081',
            'expo-platform': 'ios',
            // This is different to the classic manifest middleware.
            'expo-accept-signature': 'true',
          },
        })
      )
    ).toEqual({
      explicitlyPrefersMultipartMixed: true,
      acceptSignature: true,
      hostname: 'localhost',
      // We don't care much about the platform here since it's already tested.
      platform: 'ios',
    });
  });
});

describe('_getManifestResponseAsync', () => {
  beforeEach(() => {
    APISettings.isOffline = false;
    asMock(getUserAsync).mockImplementation(async () => ({} as any));
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
    APISettings.isOffline = true;
    const results = await middleware._getManifestResponseAsync({
      explicitlyPrefersMultipartMixed: true,
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
          'content-type': expect.stringContaining('multipart/mixed'),
        })
      )
    );

    const body = await getManifestBodyAsync(results);
    expect(JSON.parse(body)).toEqual({
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
    const middleware = createMiddleware();

    const results = await middleware._getManifestResponseAsync({
      explicitlyPrefersMultipartMixed: true,
      platform: 'android',
      acceptSignature: true,
      hostname: 'localhost',
    });
    expect(results.version).toBe('45.0.0');
    expect(results.headers.get('expo-manifest-signature')).toEqual(expect.any(String));

    const body = await getManifestBodyAsync(results);
    expect(JSON.parse(body)).toEqual({
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
      explicitlyPrefersMultipartMixed: true,
      platform: 'android',
      acceptSignature: true,
      hostname: 'localhost',
    });

    expect(getProjectAsync).toBeCalledTimes(1);
  });

  it('returns text/plain when explicitlyPrefersMultipartMixed is false', async () => {
    const middleware = createMiddleware();
    APISettings.isOffline = true;
    const results = await middleware._getManifestResponseAsync({
      explicitlyPrefersMultipartMixed: false,
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
          'content-type': 'text/plain',
        })
      )
    );
  });
});
