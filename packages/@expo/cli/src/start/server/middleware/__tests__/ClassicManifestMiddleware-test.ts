import { asMock } from '../../../../__tests__/asMock';
import { ApiV2Error } from '../../../../api/rest/client';
import { signClassicExpoGoManifestAsync } from '../../../../api/signManifest';
import { getUserAsync } from '../../../../api/user/user';
import * as Log from '../../../../log';
import { env } from '../../../../utils/env';
import { ClassicManifestMiddleware } from '../ClassicManifestMiddleware';
import { ServerRequest } from '../server.types';

jest.mock('../../../../api/signManifest', () => ({
  signClassicExpoGoManifestAsync: jest.fn((manifest) => JSON.stringify(manifest)),
}));
jest.mock('../../../../api/user/user');
jest.mock('../../../../log');
jest.mock('../resolveAssets', () => ({
  resolveManifestAssets: jest.fn(),
  resolveGoogleServicesFile: jest.fn(),
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
jest.mock('../resolveEntryPoint', () => ({
  resolveEntryPoint: jest.fn(() => './index.js'),
  resolveAbsoluteEntryPoint: jest.fn((projectRoot: string) =>
    require('path').join(projectRoot, './index.js')
  ),
}));

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

beforeEach(() => {
  delete process.env.EXPO_OFFLINE;
});

describe('getParsedHeaders', () => {
  const middleware = new ClassicManifestMiddleware('/', {} as any);
  it('returns empty object when the request headers are not defined', () => {
    expect(
      middleware.getParsedHeaders(
        asReq({
          url: 'http://localhost:8081',
          headers: {},
        })
      )
    ).toEqual({
      acceptSignature: false,
      hostname: null,
      platform: 'ios',
    });
  });
  it(`returns a fully qualified object`, () => {
    expect(
      middleware.getParsedHeaders(
        asReq({
          url: 'http://localhost:8081',
          headers: { host: 'localhost:8081', 'exponent-accept-signature': 'true' },
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

describe('_fetchComputedManifestStringAsync', () => {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
  });

  // Sanity
  it('returns a signed manifest', async () => {
    const middleware = new ClassicManifestMiddleware('/', {} as any);
    middleware._getManifestStringAsync = jest.fn(async () => {
      return 'signed-manifest-lol';
    });
    await expect(
      middleware._fetchComputedManifestStringAsync({
        manifest: {} as any,
        acceptSignature: true,
        hostId: 'foobar',
      })
    ).resolves.toEqual('signed-manifest-lol');
  });

  // Error handling
  it('handles an unauthorized error', async () => {
    const middleware = new ClassicManifestMiddleware('/', {} as any);
    middleware._getManifestStringAsync = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new ApiV2Error({ message: '...', code: 'UNAUTHORIZED' });
      })
      .mockImplementationOnce(async () => 'signed-manifest-lol');

    await expect(
      middleware._fetchComputedManifestStringAsync({
        manifest: { owner: 'bacon' } as any,
        acceptSignature: true,
        hostId: 'foobar',
      })
    ).resolves.toEqual('signed-manifest-lol');

    expect(middleware._getManifestStringAsync).toBeCalledTimes(2);

    expect(Log.warn).toBeCalledWith(
      expect.stringMatching(
        /This project belongs to.*@bacon.*and you have not been granted the appropriate permissions/
      )
    );
    expect(Log.warn).toBeCalledWith(expect.stringMatching(/Falling back to offline mode/));
    expect(env.EXPO_OFFLINE).toBe(true);
  });

  it('handles a DNS error', async () => {
    const middleware = new ClassicManifestMiddleware('/', {} as any);
    middleware._getManifestStringAsync = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new ApiV2Error({ message: '...', code: 'ENOTFOUND' });
      })
      .mockImplementationOnce(async () => 'signed-manifest-lol');

    await expect(
      middleware._fetchComputedManifestStringAsync({
        manifest: { owner: 'bacon' } as any,
        acceptSignature: true,
        hostId: 'foobar',
      })
    ).resolves.toEqual('signed-manifest-lol');

    expect(middleware._getManifestStringAsync).toBeCalledTimes(2);

    expect(Log.warn).toBeCalledWith(
      expect.stringMatching(
        /Could not reach Expo servers, please check if you can access exp\.host/
      )
    );
    expect(Log.warn).toBeCalledWith(expect.stringMatching(/Falling back to offline mode/));
    expect(env.EXPO_OFFLINE).toBe(true);
  });

  it('throws unhandled error', async () => {
    const middleware = new ClassicManifestMiddleware('/', {} as any);
    middleware._getManifestStringAsync = jest.fn().mockImplementationOnce(() => {
      throw new Error('demo');
    });

    await expect(
      middleware._fetchComputedManifestStringAsync({
        manifest: { owner: 'bacon' } as any,
        acceptSignature: true,
        hostId: 'foobar',
      })
    ).rejects.toThrow(/demo/);

    expect(middleware._getManifestStringAsync).toBeCalledTimes(1);

    expect(Log.warn).not.toBeCalled();
    expect(env.EXPO_OFFLINE).toBe(false);
  });

  it('memoizes warnings', async () => {
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    middleware._getManifestStringAsync = jest.fn(() => {
      throw new ApiV2Error({ message: '...', code: 'ENOTFOUND' });
    });

    const invokeMethod = async (owner = 'bacon') => {
      await expect(
        middleware._fetchComputedManifestStringAsync({
          manifest: { owner } as any,
          acceptSignature: true,
          hostId: 'foobar',
        })
      ).rejects.toThrow();
      delete process.env.EXPO_OFFLINE;
    };

    // Call twice...
    await invokeMethod();
    await invokeMethod();

    // Verify twice
    expect(middleware._getManifestStringAsync).toBeCalledTimes(4);

    // Important that we don't warn more than once.
    expect(Log.warn).toBeCalledTimes(1);

    middleware._getManifestStringAsync = jest.fn(() => {
      throw new ApiV2Error({ message: '...', code: 'UNAUTHORIZED' });
    });

    // Call again but with a different error.
    await invokeMethod();
    await invokeMethod();
    // Should log a new error...
    expect(Log.warn).toBeCalledTimes(2);
    expect(Log.warn).toHaveBeenNthCalledWith(2, expect.stringMatching(/@bacon/));

    // Call again but with the same error but a new config owner.
    await invokeMethod('other-bacon');
    await invokeMethod('other-bacon');
    // Should log a new error...
    expect(Log.warn).toBeCalledTimes(3);
    expect(Log.warn).toHaveBeenNthCalledWith(3, expect.stringMatching(/@other-bacon/));
  });
});

describe('_getManifestResponseAsync', () => {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
  });

  // Regression
  it('returns Exponent-Server header as json string', async () => {
    const middleware = new ClassicManifestMiddleware('/', {
      constructUrl: (options) => options?.hostname || 'localhost',
    });

    middleware._getManifestStringAsync = jest.fn(async () => {
      return 'signed-manifest-lol';
    });

    const response = await middleware._getManifestResponseAsync({
      acceptSignature: true,
      hostname: 'localhost',
      platform: 'android',
    });

    const header = response.headers.get('Exponent-Server');

    expect(typeof header).toBe('string');
    expect(() => JSON.parse(header as string)).not.toThrow();
  });
});

describe(`_getManifestStringAsync`, () => {
  it(`uses anon ID for offline mode`, async () => {
    asMock(getUserAsync).mockImplementationOnce(async () => ({} as any));
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    process.env.EXPO_OFFLINE = '1';

    expect(
      JSON.parse(
        await middleware._getManifestStringAsync({
          manifest: { owner: 'bacon', slug: 'slug' } as any,
          acceptSignature: false,
          hostId: 'host-id',
        })
      ).id
    ).toEqual('@anonymous/slug-host-id');
  });
  it(`uses anon ID for unauthenticated users`, async () => {
    asMock(getUserAsync).mockImplementationOnce(async () => undefined);
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    expect(
      JSON.parse(
        await middleware._getManifestStringAsync({
          manifest: { owner: 'bacon', slug: 'slug' } as any,
          acceptSignature: false,
          hostId: 'host-id',
        })
      ).id
    ).toEqual('@anonymous/slug-host-id');
  });

  it(`uses anon ID with unsigned signature for unauthenticated users`, async () => {
    asMock(getUserAsync).mockImplementationOnce(async () => undefined);
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    expect(
      JSON.parse(
        await middleware._getManifestStringAsync({
          manifest: { owner: 'bacon', slug: 'slug' } as any,
          acceptSignature: true,
          hostId: 'host-id',
        })
      )
    ).toEqual({ manifestString: expect.any(String), signature: 'UNSIGNED' });
  });

  it(`memoizes signature signing`, async () => {
    asMock(getUserAsync).mockImplementation(async () => ({} as any));
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    const invokeAsync = async (owner = 'bacon') => {
      await middleware._getManifestStringAsync({
        manifest: { owner, slug: 'slug' } as any,
        acceptSignature: true,
        hostId: 'host-id',
      });
    };

    await invokeAsync();
    await invokeAsync();

    expect(signClassicExpoGoManifestAsync).toBeCalledTimes(1);

    await invokeAsync('new-bacon');
    await invokeAsync('new-bacon');

    expect(signClassicExpoGoManifestAsync).toBeCalledTimes(2);
  });
});
