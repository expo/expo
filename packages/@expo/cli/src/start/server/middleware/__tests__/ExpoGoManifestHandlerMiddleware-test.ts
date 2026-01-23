import { GraphQLError } from '@0no-co/graphql.web';
import { ExpoConfig } from '@expo/config';
import { vol } from 'memfs';
import { parseMultipart } from 'multitars';

import { AppQuery } from '../../../../api/graphql/queries/AppQuery';
import { getUserAsync } from '../../../../api/user/user';
import {
  mockExpoRootChain,
  mockSelfSigned,
} from '../../../../utils/__tests__/fixtures/certificates';
import {
  ExpoGoManifestHandlerMiddleware,
  ResponseContentType,
} from '../ExpoGoManifestHandlerMiddleware';
import { ManifestMiddlewareOptions } from '../ManifestMiddleware';
import { resolveRuntimeVersionWithExpoUpdatesAsync } from '../resolveRuntimeVersionWithExpoUpdatesAsync';
import { ServerRequest } from '../server.types';

jest.mock('../../../../api/user/user');
jest.mock('../../../../log');
jest.mock('../../../../api/graphql/queries/AppQuery', () => ({
  AppQuery: {
    byIdAsync: jest.fn(),
  },
}));
jest.mock('@expo/code-signing-certificates', () => ({
  ...(jest.requireActual(
    '@expo/code-signing-certificates'
  ) as typeof import('@expo/code-signing-certificates')),
  generateKeyPair: jest.fn(() =>
    (
      jest.requireActual(
        '@expo/code-signing-certificates'
      ) as typeof import('@expo/code-signing-certificates')
    ).convertKeyPairPEMToKeyPair({
      publicKeyPEM: mockExpoRootChain.publicKeyPEM,
      privateKeyPEM: mockExpoRootChain.privateKeyPEM,
    })
  ),
}));
jest.mock('../../../../api/getProjectDevelopmentCertificate', () => ({
  getProjectDevelopmentCertificateAsync: jest.fn(() => mockExpoRootChain.developmentCertificate),
}));
jest.mock('../../../../api/getExpoGoIntermediateCertificate', () => ({
  getExpoGoIntermediateCertificateAsync: jest.fn(
    () => mockExpoRootChain.expoGoIntermediateCertificate
  ),
}));
jest.mock('@expo/config-plugins', () => ({
  Updates: {
    getRuntimeVersionAsync: jest.fn(() => Promise.resolve('45.0.0')),
  },
}));
jest.mock('../resolveAssets', () => ({
  resolveManifestAssets: jest.fn(),
  resolveGoogleServicesFile: jest.fn(),
}));
jest.mock('@expo/config/paths', () => ({
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
jest.mock('../resolveRuntimeVersionWithExpoUpdatesAsync');

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

beforeEach(() => {
  vol.reset();
});

describe('getParsedHeaders', () => {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
  });
  const middleware = new ExpoGoManifestHandlerMiddleware('/', {} as any);

  it('defaults to "ios" with no platform header', () => {
    expect(
      middleware.getParsedHeaders(
        asReq({
          url: 'http://localhost:3000',
          headers: {},
        })
      )
    ).toEqual({
      expectSignature: null,
      responseContentType: ResponseContentType.TEXT_PLAIN,
      hostname: null,
      platform: 'ios',
    });
  });

  it('returns default values from headers', () => {
    expect(
      middleware.getParsedHeaders(
        asReq({ url: 'http://localhost:3000', headers: { 'expo-platform': 'android' } })
      )
    ).toEqual({
      responseContentType: ResponseContentType.TEXT_PLAIN,
      expectSignature: null,
      hostname: null,
      platform: 'android',
    });
  });

  it('supports application/json and expo+json', () => {
    expect(
      middleware.getParsedHeaders(
        asReq({
          url: 'http://localhost:3000',
          headers: { 'expo-platform': 'android', accept: 'application/json' },
        })
      )
    ).toEqual({
      responseContentType: ResponseContentType.APPLICATION_JSON,
      expectSignature: null,
      hostname: null,
      platform: 'android',
    });

    expect(
      middleware.getParsedHeaders(
        asReq({
          url: 'http://localhost:3000',
          headers: { 'expo-platform': 'android', accept: 'application/expo+json' },
        })
      )
    ).toEqual({
      responseContentType: ResponseContentType.APPLICATION_EXPO_JSON,
      expectSignature: null,
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
            'expo-expect-signature': 'wat',
          },
        })
      )
    ).toEqual({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      expectSignature: 'wat',
      hostname: 'localhost',
      // We don't care much about the platform here since it's already tested.
      platform: 'ios',
    });
  });
});

describe('_getManifestResponseAsync', () => {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
    jest.mocked(getUserAsync).mockImplementation(async () => ({
      __typename: 'User',
      id: 'userwat',
      username: 'wat',
      primaryAccount: { id: 'blah-account' },
      accounts: [],
    }));

    jest.mocked(AppQuery.byIdAsync).mockImplementation(
      async () =>
        ({
          id: 'blah',
          scopeKey: 'scope-key',
          ownerAccount: {
            id: 'blah-account',
          },
        }) as any
    );
  });

  function createMiddleware(
    extraExpFields?: Partial<ExpoConfig>,
    options: Partial<ManifestMiddlewareOptions> = {}
  ) {
    const middleware = new ExpoGoManifestHandlerMiddleware('/', options as any);

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
            ...extraExpFields,
          },
        }) as any
    );
    return middleware;
  }

  // Sanity
  it('returns an anon manifest when no code signing is requested', async () => {
    const middleware = createMiddleware();
    process.env.EXPO_OFFLINE = '1';

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: null,
      hostname: 'localhost',
    });

    expect(Object.fromEntries(response.headers.entries())).toEqual({
      'expo-protocol-version': '0',
      'expo-sfv-version': '0',
      'cache-control': 'private, max-age=0',
      'content-type': expect.stringContaining('multipart/mixed'),
    });

    const partsSeen = new Set<string>();
    const contentType = response.headers.get('content-type')!;
    for await (const part of parseMultipart(response.body!, { contentType })) {
      partsSeen.add(part.name);
      switch (part.name) {
        case 'manifest':
          expect(await part.json()).toEqual({
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
          break;
        case 'certificate_chain':
          break;
        default:
          throw new Error(`Unexpected part: ${part.name}`);
      }
    }

    expect(partsSeen.has('manifest')).toBeTruthy();
  });

  it('returns an anon manifest when viewer does not have permission to view app', async () => {
    jest.mocked(AppQuery.byIdAsync).mockImplementation(async () => {
      throw new GraphQLError('test');
    });

    const middleware = createMiddleware();

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: 'sig, keyid="expo-root", alg="rsa-v1_5-sha256"',
      hostname: 'localhost',
    });

    const partsSeen = new Set<string>();
    const contentType = response.headers.get('content-type')!;
    for await (const part of parseMultipart(response.body!, { contentType })) {
      partsSeen.add(part.name);
      switch (part.name) {
        case 'manifest':
          expect(part.headers['expo-signature']).toBe(undefined);
          expect(await part.json()).toEqual({
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
          break;
        case 'certificate_chain':
          break;
        default:
          throw new Error(`Unexpected part: ${part.name}`);
      }
    }

    expect(partsSeen.has('manifest')).toBeTruthy();
  });

  it('returns an anon manifest when viewer can view app but does not have permission to view account', async () => {
    jest.mocked(AppQuery.byIdAsync).mockImplementation(
      async () =>
        ({
          id: 'blah',
          scopeKey: 'scope-key',
          ownerAccount: {
            id: 'blah-other-account',
          },
        }) as any
    );

    const middleware = createMiddleware();

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: 'sig, keyid="expo-root", alg="rsa-v1_5-sha256"',
      hostname: 'localhost',
    });

    const partsSeen = new Set<string>();
    const contentType = response.headers.get('content-type')!;
    for await (const part of parseMultipart(response.body!, { contentType })) {
      partsSeen.add(part.name);
      switch (part.name) {
        case 'manifest':
          expect(part.headers['expo-signature']).toBe(undefined);
          expect(await part.json()).toEqual({
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
          break;
        case 'certificate_chain':
          break;
        default:
          throw new Error(`Unexpected part: ${part.name}`);
      }
    }

    expect(partsSeen.has('manifest')).toBeTruthy();
  });

  it('returns a code signed manifest with developers own key when requested', async () => {
    vol.fromJSON({
      'certs/cert.pem': mockSelfSigned.certificate,
      'custom/private/key/path/private-key.pem': mockSelfSigned.privateKey,
    });

    const middleware = createMiddleware(
      {
        updates: {
          codeSigningCertificate: 'certs/cert.pem',
          codeSigningMetadata: {
            keyid: 'testkeyid',
            alg: 'rsa-v1_5-sha256',
          },
        },
      },
      {
        privateKeyPath: 'custom/private/key/path/private-key.pem',
      }
    );

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: 'sig, keyid="testkeyid", alg="rsa-v1_5-sha256"',
      hostname: 'localhost',
    });

    const partsSeen = new Set<string>();
    const contentType = response.headers.get('content-type')!;
    for await (const part of parseMultipart(response.body!, { contentType })) {
      partsSeen.add(part.name);
      switch (part.name) {
        case 'manifest':
          expect(part.headers['expo-signature']).toContain('keyid="testkeyid"');
          expect(await part.json()).toEqual({
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
              scopeKey: expect.stringMatching(/@anonymous\/.*/),
            },
          });
          break;
        case 'certificate_chain':
          break;
        default:
          throw new Error(`Unexpected part: ${part.name}`);
      }
    }

    expect([...partsSeen]).toEqual(['manifest']);
  });

  it('returns a code signed manifest with expo-root chain when requested', async () => {
    const middleware = createMiddleware();

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: 'sig, keyid="expo-root", alg="rsa-v1_5-sha256"',
      hostname: 'localhost',
    });

    const partsSeen = new Set<string>();
    const contentType = response.headers.get('content-type')!;
    for await (const part of parseMultipart(response.body!, { contentType })) {
      partsSeen.add(part.name);
      switch (part.name) {
        case 'manifest':
          expect(part.headers['expo-signature']).toContain('keyid="expo-go"');
          expect(await part.json()).toEqual({
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
              scopeKey: 'scope-key',
            },
          });
          break;
        case 'certificate_chain':
          expect(await part.text()).toMatchSnapshot();
          break;
        default:
          throw new Error(`Unexpected part: ${part.name}`);
      }
    }

    expect([...partsSeen]).toEqual(['manifest', 'certificate_chain']);
  });

  it('returns a code signed manifest with developers own key when requested when offline', async () => {
    vol.fromJSON({
      'certs/cert.pem': mockSelfSigned.certificate,
      'custom/private/key/path/private-key.pem': mockSelfSigned.privateKey,
    });

    process.env.EXPO_OFFLINE = '1';

    const middleware = createMiddleware(
      {
        updates: {
          codeSigningCertificate: 'certs/cert.pem',
          codeSigningMetadata: {
            keyid: 'testkeyid',
            alg: 'rsa-v1_5-sha256',
          },
        },
      },
      {
        privateKeyPath: 'custom/private/key/path/private-key.pem',
      }
    );

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: 'sig, keyid="testkeyid", alg="rsa-v1_5-sha256"',
      hostname: 'localhost',
    });

    const partsSeen = new Set<string>();
    const contentType = response.headers.get('content-type')!;
    for await (const part of parseMultipart(response.body!, { contentType })) {
      partsSeen.add(part.name);
      switch (part.name) {
        case 'manifest':
          expect(part.headers['expo-signature']).toContain('keyid="testkeyid"');
          expect(await part.json()).toEqual({
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
              scopeKey: expect.stringMatching(/@anonymous\/.*/),
            },
          });
          break;
        case 'certificate_chain':
          break;
        default:
          throw new Error(`Unexpected part: ${part.name}`);
      }
    }

    expect([...partsSeen]).toEqual(['manifest']);
  });

  it('returns a code signed manifest with expo-root chain when requested when offline and has cached dev cert', async () => {
    // start online to cache cert and stuff
    delete process.env.EXPO_OFFLINE;

    const middlewareOnline = createMiddleware();
    await middlewareOnline._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: 'sig, keyid="expo-root", alg="rsa-v1_5-sha256"',
      hostname: 'localhost',
    });

    // go offline
    process.env.EXPO_OFFLINE = '1';

    const middleware = createMiddleware();

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: 'sig, keyid="expo-root", alg="rsa-v1_5-sha256"',
      hostname: 'localhost',
    });

    const partsSeen = new Set<string>();
    const contentType = response.headers.get('content-type')!;
    for await (const part of parseMultipart(response.body!, { contentType })) {
      partsSeen.add(part.name);
      switch (part.name) {
        case 'manifest':
          expect(part.headers['expo-signature']).toContain('keyid="expo-go"');
          expect(await part.json()).toEqual({
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
              scopeKey: 'scope-key',
            },
          });
          break;
        case 'certificate_chain':
          expect(await part.text()).toMatchSnapshot();
          break;
        default:
          throw new Error(`Unexpected part: ${part.name}`);
      }
    }

    expect([...partsSeen]).toEqual(['manifest', 'certificate_chain']);
  });

  it('returns application/json when requested', async () => {
    const middleware = createMiddleware();
    process.env.EXPO_OFFLINE = '1';

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.APPLICATION_JSON,
      platform: 'android',
      expectSignature: null,
      hostname: 'localhost',
    });

    expect(await response.json()).toMatchObject({
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
        scopeKey: expect.stringMatching(/@anonymous\/.*/),
      },
    });

    expect(Object.fromEntries(response.headers.entries())).toEqual({
      'expo-protocol-version': '0',
      'expo-sfv-version': '0',
      'cache-control': 'private, max-age=0',
      'content-type': 'application/json',
    });
  });

  it('returns text/plain when explicitlyPrefersMultipartMixed is false', async () => {
    const middleware = createMiddleware();
    process.env.EXPO_OFFLINE = '1';

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.TEXT_PLAIN,
      platform: 'android',
      expectSignature: null,
      hostname: 'localhost',
    });

    expect(await response.json()).toMatchObject({
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
        scopeKey: expect.stringMatching(/@anonymous\/.*/),
      },
    });

    expect(Object.fromEntries(response.headers.entries())).toEqual({
      'expo-protocol-version': '0',
      'expo-sfv-version': '0',
      'cache-control': 'private, max-age=0',
      'content-type': 'text/plain',
    });
  });

  it('delegates runtime version resolution to expo-updates if possible', async () => {
    jest.mocked(resolveRuntimeVersionWithExpoUpdatesAsync).mockResolvedValue('testrtv');

    const middleware = createMiddleware();
    process.env.EXPO_OFFLINE = '1';

    const response = await middleware._getManifestResponseAsync({
      responseContentType: ResponseContentType.MULTIPART_MIXED,
      platform: 'android',
      expectSignature: null,
      hostname: 'localhost',
    });

    const partsSeen = new Set<string>();
    const contentType = response.headers.get('content-type')!;
    for await (const part of parseMultipart(response.body!, { contentType })) {
      partsSeen.add(part.name);
      if (part.name === 'manifest') {
        expect(await part.json()).toMatchObject({
          runtimeVersion: 'testrtv',
        });
      }
    }

    expect(partsSeen.has('manifest')).toBeTruthy();
  });
});
