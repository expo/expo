import { signClassicExpoGoManifestAsync } from '../../../../api/signManifest';
import { getUserAsync } from '../../../../api/user/user';
import * as Log from '../../../../log';
import { CommandError } from '../../../../utils/errors';
import { ProcessSettings } from '../../../ProcessSettings';
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
jest.mock('../../../ProcessSettings', () => ({
  ProcessSettings: {
    isOffline: false,
  },
}));

jest.mock('../resolveEntryPoint', () => ({
  resolveEntryPoint: jest.fn(() => './index.js'),
}));

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
}));

beforeEach(() => {
  ProcessSettings.isOffline = false;
});

describe('getParsedHeaders', () => {
  const middleware = new ClassicManifestMiddleware('/', {} as any);
  it('returns empty object when the request headers are not defined', () => {
    expect(middleware.getParsedHeaders(asReq({}))).toEqual({
      acceptSignature: false,
      hostname: undefined,
      platform: 'ios',
    });
  });
  it(`returns a fully qualified object`, () => {
    expect(
      middleware.getParsedHeaders(
        asReq({ headers: { host: 'localhost:8081', 'exponent-accept-signature': 'true' } })
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
    asMock(Log.warn).mockClear();
    const middleware = new ClassicManifestMiddleware('/', {} as any);
    middleware._getManifestStringAsync = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new CommandError('UNAUTHORIZED_ERROR');
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
    expect(ProcessSettings.isOffline).toBe(true);
  });

  it('handles a DNS error', async () => {
    asMock(Log.warn).mockClear();
    const middleware = new ClassicManifestMiddleware('/', {} as any);
    middleware._getManifestStringAsync = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new CommandError('ENOTFOUND');
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
    expect(ProcessSettings.isOffline).toBe(true);
  });

  it('throws unhandled error', async () => {
    asMock(Log.warn).mockClear();
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
    expect(ProcessSettings.isOffline).toBe(false);
  });

  it('memoizes warnings', async () => {
    asMock(Log.warn).mockClear();
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    middleware._getManifestStringAsync = jest.fn(() => {
      throw new CommandError('ENOTFOUND');
    });

    const invokeMethod = async (owner = 'bacon') => {
      await expect(
        middleware._fetchComputedManifestStringAsync({
          manifest: { owner } as any,
          acceptSignature: true,
          hostId: 'foobar',
        })
      ).rejects.toThrow();
      ProcessSettings.isOffline = false;
    };

    // Call twice...
    await invokeMethod();
    await invokeMethod();

    // Verify twice
    expect(middleware._getManifestStringAsync).toBeCalledTimes(4);

    // Important that we don't warn more than once.
    expect(Log.warn).toBeCalledTimes(1);

    middleware._getManifestStringAsync = jest.fn(() => {
      throw new CommandError('UNAUTHORIZED_ERROR');
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

describe(`_getManifestStringAsync`, () => {
  it(`uses anon ID for offline mode`, async () => {
    asMock(getUserAsync)
      .mockClear()
      .mockImplementationOnce(async () => ({} as any));
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    ProcessSettings.isOffline = true;

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
    asMock(getUserAsync)
      .mockClear()
      .mockImplementationOnce(async () => undefined);
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    ProcessSettings.isOffline = false;

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
    asMock(getUserAsync)
      .mockClear()
      .mockImplementationOnce(async () => undefined);
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    ProcessSettings.isOffline = false;

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
    asMock(signClassicExpoGoManifestAsync).mockClear();
    asMock(getUserAsync)
      .mockClear()
      .mockImplementation(async () => ({} as any));
    const middleware = new ClassicManifestMiddleware('/', {} as any);

    ProcessSettings.isOffline = false;

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
