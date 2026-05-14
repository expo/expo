import {
  createOpenMiddlewareOptions,
  resolveOpenInfo,
} from '../createOpenMiddlewareOptions';
import { OpenDiscoveryResult, OpenSinglePlatformResult } from '../OpenMiddleware';
import { UrlCreator } from '../../UrlCreator';

jest.mock('../../../../log');

const TUNNEL_URL = 'https://abc.ngrok-free.app';
const LAN_ADDR = '192.168.7.42';

beforeEach(() => {
  delete process.env.EXPO_PACKAGER_PROXY_URL;
  delete process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
});

function lanCreator(scheme: string | null = 'myapp') {
  return new UrlCreator(
    { scheme: scheme ?? undefined },
    { port: 8081, getTunnelUrl: () => null },
    { address: LAN_ADDR }
  );
}

function tunnelCreator(scheme: string | null = 'myapp') {
  return new UrlCreator(
    { scheme: scheme ?? undefined, hostType: 'tunnel' },
    { port: 8081, getTunnelUrl: () => TUNNEL_URL },
    { address: LAN_ADDR }
  );
}

const allOk = () => ({ canOpen: true } as const);
const noAppId = async () => null;
const sampleAppIds = async (platform: 'ios' | 'android' | 'web') => {
  if (platform === 'ios') return 'com.example.app.ios';
  if (platform === 'android') return 'com.example.app.android';
  return null;
};

describe('resolveOpenInfo — LAN (no tunnel)', () => {
  const deps = {
    urlCreator: lanCreator(),
    getScheme: () => 'myapp',
    getIsDevClient: () => false,
    getIsRedirectPageEnabled: () => false,
    getHostSupport: allOk,
    getAppId: noAppId,
  };

  it('returns the LAN expo go deep link for ios', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'ios', runtime: 'default' },
      deps
    )) as OpenSinglePlatformResult;
    expect(info.runtime).toBe('expo');
    expect(info.url).toBe(`exp://${LAN_ADDR}:8081`);
    expect(info.availableRuntimes).toEqual(['expo']);
  });

  it('returns the LAN host for web', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'web', runtime: 'default' },
      deps
    )) as OpenSinglePlatformResult;
    expect(info.runtime).toBe('web');
    expect(info.url).toBe(`http://${LAN_ADDR}:8081`);
  });
});

describe('resolveOpenInfo — tunnel', () => {
  const baseDeps = {
    urlCreator: tunnelCreator('myapp'),
    getScheme: () => 'myapp',
    getIsDevClient: () => false,
    getIsRedirectPageEnabled: () => false,
    getHostSupport: allOk,
    getAppId: noAppId,
  };

  it('routes expo go URLs through the tunnel host', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'ios', runtime: 'expo' },
      baseDeps
    )) as OpenSinglePlatformResult;
    expect(info.url).toBe('exp://abc.ngrok-free.app');
  });

  it('routes dev client URLs through the tunnel host (with https inner URL)', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'android', runtime: 'custom' },
      baseDeps
    )) as OpenSinglePlatformResult;
    expect(info.url).toBe(
      'myapp://expo-development-client/?url=https%3A%2F%2Fabc.ngrok-free.app'
    );
  });

  it('routes the disambiguation URL through the tunnel host and omits the runtime field', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'ios', runtime: 'default' },
      { ...baseDeps, getIsRedirectPageEnabled: () => true }
    )) as OpenSinglePlatformResult;
    expect(info.runtime).toBeUndefined();
    expect(info.url).toBe('http://abc.ngrok-free.app/_expo/loading?platform=ios');
    expect(info.availableRuntimes).toEqual(['expo', 'custom']);
  });

  it('returns the tunnel URL for web (regression: previously hardcoded localhost)', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'web', runtime: 'default' },
      baseDeps
    )) as OpenSinglePlatformResult;
    expect(info.url).toBe('http://abc.ngrok-free.app');
    expect(info.url).not.toMatch(/localhost|127\.0\.0\.1/);
  });

  it('returns tunnel URLs for every platform in discovery mode', async () => {
    const info = (await resolveOpenInfo(
      { platform: null, runtime: 'default' },
      { ...baseDeps, getIsRedirectPageEnabled: () => true }
    )) as OpenDiscoveryResult;
    expect(info.platforms.ios.url).toBe(
      'http://abc.ngrok-free.app/_expo/loading?platform=ios'
    );
    expect(info.platforms.android.url).toBe(
      'http://abc.ngrok-free.app/_expo/loading?platform=android'
    );
    expect(info.platforms.web.url).toBe('http://abc.ngrok-free.app');
    expect(info.platforms.ios.url).not.toMatch(/localhost|127\.0\.0\.1/);
    expect(info.platforms.web.url).not.toMatch(/localhost|127\.0\.0\.1/);
  });
});

describe('resolveOpenInfo — runtime: default resolution', () => {
  it('--dev-client → runtime "custom" with the dev client URL', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'ios', runtime: 'default' },
      {
        urlCreator: lanCreator('myapp'),
        getScheme: () => 'myapp',
        getIsDevClient: () => true,
        getIsRedirectPageEnabled: () => false,
        getHostSupport: allOk,
        getAppId: noAppId,
      }
    )) as OpenSinglePlatformResult;
    expect(info.runtime).toBe('custom');
    expect(info.url).toMatch(/^myapp:\/\/expo-development-client\//);
    expect(info.availableRuntimes).toEqual(['custom']);
  });

  it('project has both → runtime omitted with the disambiguation URL', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'android', runtime: 'default' },
      {
        urlCreator: lanCreator('myapp'),
        getScheme: () => 'myapp',
        getIsDevClient: () => false,
        getIsRedirectPageEnabled: () => true,
        getHostSupport: allOk,
        getAppId: noAppId,
      }
    )) as OpenSinglePlatformResult;
    expect(info.runtime).toBeUndefined();
    expect(info.url).toBe(`http://${LAN_ADDR}:8081/_expo/loading?platform=android`);
  });

  it('expo go only → runtime "expo" with the exp:// URL', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'ios', runtime: 'default' },
      {
        urlCreator: lanCreator('myapp'),
        getScheme: () => 'myapp',
        getIsDevClient: () => false,
        getIsRedirectPageEnabled: () => false,
        getHostSupport: allOk,
        getAppId: noAppId,
      }
    )) as OpenSinglePlatformResult;
    expect(info.runtime).toBe('expo');
    expect(info.url).toBe(`exp://${LAN_ADDR}:8081`);
  });
});

describe('resolveOpenInfo — runtime=unknown (explicit interstitial)', () => {
  it('returns the disambiguation URL with no runtime field, even when the CLI would resolve directly', async () => {
    // Expo Go-only project: default would return runtime=expo; runtime=unknown still hands back the interstitial.
    const info = (await resolveOpenInfo(
      { platform: 'ios', runtime: 'unknown' },
      {
        urlCreator: lanCreator('myapp'),
        getScheme: () => 'myapp',
        getIsDevClient: () => false,
        getIsRedirectPageEnabled: () => false,
        getAppId: noAppId,
      }
    )) as OpenSinglePlatformResult;
    expect(info.runtime).toBeUndefined();
    expect(info.url).toBe(`http://${LAN_ADDR}:8081/_expo/loading?platform=ios`);
  });
});

describe('resolveOpenInfo — live state', () => {
  it('reflects mid-run isDevClient changes (`s` in the terminal)', async () => {
    let isDevClient = false;
    const deps = {
      urlCreator: lanCreator('myapp'),
      getScheme: () => 'myapp',
      getIsDevClient: () => isDevClient,
      getIsRedirectPageEnabled: () => false,
      getAppId: noAppId,
    };
    const before = (await resolveOpenInfo({ platform: 'ios', runtime: 'default' }, deps)) as OpenSinglePlatformResult;
    expect(before.runtime).toBe('expo');
    expect(before.availableRuntimes).toEqual(['expo']);

    isDevClient = true;
    const after = (await resolveOpenInfo({ platform: 'ios', runtime: 'default' }, deps)) as OpenSinglePlatformResult;
    expect(after.runtime).toBe('custom');
    expect(after.availableRuntimes).toEqual(['custom']);
  });

  it('reflects mid-run expo-dev-client installation (isRedirectPageEnabled flips)', async () => {
    let redirectEnabled = false;
    const deps = {
      urlCreator: lanCreator('myapp'),
      getScheme: () => 'myapp',
      getIsDevClient: () => false,
      getIsRedirectPageEnabled: () => redirectEnabled,
      getAppId: noAppId,
    };
    const before = (await resolveOpenInfo({ platform: 'ios', runtime: 'default' }, deps)) as OpenSinglePlatformResult;
    expect(before.availableRuntimes).toEqual(['expo']);
    expect(before.runtime).toBe('expo');

    redirectEnabled = true;
    const after = (await resolveOpenInfo({ platform: 'ios', runtime: 'default' }, deps)) as OpenSinglePlatformResult;
    expect(after.availableRuntimes).toEqual(['expo', 'custom']);
    expect(after.runtime).toBeUndefined(); // falls through to the disambiguation page
    expect(after.url).toMatch(/_expo\/loading/);
  });

  it('reflects mid-run scheme changes', async () => {
    let scheme: string | null = 'oldscheme';
    const deps = {
      urlCreator: lanCreator('myapp'),
      getScheme: () => scheme,
      getIsDevClient: () => false,
      getIsRedirectPageEnabled: () => false,
      getAppId: noAppId,
    };
    const before = (await resolveOpenInfo({ platform: 'ios', runtime: 'default' }, deps)) as OpenSinglePlatformResult;
    expect(before.scheme).toBe('oldscheme');

    scheme = 'newscheme';
    const after = (await resolveOpenInfo({ platform: 'ios', runtime: 'default' }, deps)) as OpenSinglePlatformResult;
    expect(after.scheme).toBe('newscheme');
  });
});

describe('resolveOpenInfo — appId', () => {
  const baseDeps = {
    urlCreator: lanCreator('myapp'),
    getScheme: () => 'myapp',
    getIsDevClient: () => false,
    getIsRedirectPageEnabled: () => false,
    getHostSupport: allOk,
  };

  it('includes the resolved appId on single-platform responses', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'ios', runtime: 'default' },
      { ...baseDeps, getAppId: sampleAppIds }
    )) as OpenSinglePlatformResult;
    expect(info.appId).toBe('com.example.app.ios');
  });

  it('per-platform appIds in discovery mode (web is always null)', async () => {
    const info = (await resolveOpenInfo(
      { platform: null, runtime: 'default' },
      { ...baseDeps, getAppId: sampleAppIds }
    )) as OpenDiscoveryResult;
    expect(info.platforms.ios.appId).toBe('com.example.app.ios');
    expect(info.platforms.android.appId).toBe('com.example.app.android');
    expect(info.platforms.web.appId).toBeNull();
  });

  it('null when the project has no bundle identifier / package name', async () => {
    const info = (await resolveOpenInfo(
      { platform: 'ios', runtime: 'default' },
      { ...baseDeps, getAppId: noAppId }
    )) as OpenSinglePlatformResult;
    expect(info.appId).toBeNull();
  });

  it('resolves appIds in parallel during discovery', async () => {
    const order: string[] = [];
    let resolveIos: () => void = () => {};
    let resolveAndroid: () => void = () => {};
    const iosStarted = new Promise<void>((r) => (resolveIos = r));
    const androidStarted = new Promise<void>((r) => (resolveAndroid = r));
    const getAppId = jest.fn(async (platform: 'ios' | 'android' | 'web') => {
      if (platform === 'web') return null;
      order.push(platform);
      // Mark this platform as started, then wait for the other to start too. If resolution is
      // serial this deadlocks (the second never starts because the first never resolves).
      if (platform === 'ios') {
        resolveIos();
        await androidStarted;
      } else {
        resolveAndroid();
        await iosStarted;
      }
      return `com.example.${platform}`;
    });
    const info = (await resolveOpenInfo(
      { platform: null, runtime: 'default' },
      { ...baseDeps, getAppId }
    )) as OpenDiscoveryResult;
    expect(getAppId).toHaveBeenCalledTimes(3);
    expect(order).toEqual(['ios', 'android']); // both started before either completed
    expect(info.platforms.ios.appId).toBe('com.example.ios');
    expect(info.platforms.android.appId).toBe('com.example.android');
  });
});

describe('createOpenMiddlewareOptions.open', () => {
  it('dispatches platform=ios to openPlatformAsync("simulator")', async () => {
    const openPlatformAsync = jest.fn(async () => ({ url: 'exp://opened-ios' }));
    const opts = createOpenMiddlewareOptions({
      urlCreator: lanCreator(),
      getScheme: () => 'myapp',
      getIsDevClient: () => false,
      getIsRedirectPageEnabled: () => false,
      getHostSupport: allOk,
      getAppId: noAppId,
      openPlatformAsync,
    });
    await expect(opts.open({ platform: 'ios' })).resolves.toEqual({
      platform: 'ios',
      runtime: 'expo',
      url: 'exp://opened-ios',
    });
    expect(openPlatformAsync).toHaveBeenCalledWith('simulator', { shouldPrompt: false });
  });

  it('dispatches platform=android to openPlatformAsync("emulator")', async () => {
    const openPlatformAsync = jest.fn(async () => ({ url: 'exp://opened-android' }));
    const opts = createOpenMiddlewareOptions({
      urlCreator: lanCreator(),
      getScheme: () => 'myapp',
      getIsDevClient: () => true,
      getIsRedirectPageEnabled: () => false,
      getHostSupport: allOk,
      getAppId: noAppId,
      openPlatformAsync,
    });
    const result = await opts.open({ platform: 'android' });
    expect(openPlatformAsync).toHaveBeenCalledWith('emulator', { shouldPrompt: false });
    // isDevClient → response runtime reflects 'custom'
    expect(result.runtime).toBe('custom');
  });

  it('dispatches platform=web to openPlatformAsync("desktop")', async () => {
    const openPlatformAsync = jest.fn(async () => ({ url: 'http://abc.ngrok-free.app' }));
    const opts = createOpenMiddlewareOptions({
      urlCreator: tunnelCreator(),
      getScheme: () => 'myapp',
      getIsDevClient: () => false,
      getIsRedirectPageEnabled: () => false,
      getHostSupport: allOk,
      getAppId: noAppId,
      openPlatformAsync,
    });
    const result = await opts.open({ platform: 'web' });
    expect(openPlatformAsync).toHaveBeenCalledWith('desktop');
    expect(result).toEqual({
      platform: 'web',
      runtime: 'web',
      url: 'http://abc.ngrok-free.app',
    });
  });
});
