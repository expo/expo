import type { ExpoConfig } from '@expo/config';

import { RuntimeVersionCache } from '../RuntimeVersionCache';
import type { ExpoUpdatesRuntimeVersionResult } from '../resolveRuntimeVersionWithExpoUpdatesAsync';
import { resolveRuntimeVersionWithExpoUpdatesAsync } from '../resolveRuntimeVersionWithExpoUpdatesAsync';
import type { watchFingerprintSourcesAsync } from '../watchFingerprintSourcesAsync';

jest.mock('../resolveRuntimeVersionWithExpoUpdatesAsync');
jest.mock('../watchFingerprintSourcesAsync');

const exp = { name: 'my-app', slug: 'my-app' } as ExpoConfig;

const fingerprintResult: ExpoUpdatesRuntimeVersionResult = {
  runtimeVersion: 'fingerprint-hash',
  fingerprintSources: [{ type: 'dir', filePath: 'ios', reasons: ['bareNativeDir'] }],
  workflow: 'generic',
};

type WatchOptions = Parameters<typeof watchFingerprintSourcesAsync>[1];

/** Creates a fake watcher factory that records each watcher's callbacks. */
function createFakeWatcher() {
  const watches: (WatchOptions & { close: jest.Mock })[] = [];
  const watchSourcesAsync = jest.fn(async (_projectRoot: string, options: WatchOptions) => {
    const watch = { ...options, close: jest.fn() };
    watches.push(watch);
    return { close: watch.close };
  });
  return { watches, watchSourcesAsync };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete process.env.EXPO_NO_RUNTIME_VERSION_CACHE;
  jest.mocked(resolveRuntimeVersionWithExpoUpdatesAsync).mockReset();
  jest.mocked(resolveRuntimeVersionWithExpoUpdatesAsync).mockResolvedValue(fingerprintResult);
});

afterAll(() => {
  process.env = originalEnv;
});

describe(RuntimeVersionCache, () => {
  it('resolves the fingerprint runtime version once for repeated requests', async () => {
    const { watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);

    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(1);
    expect(watchSourcesAsync).toHaveBeenCalledTimes(1);
    expect(watchSourcesAsync).toHaveBeenCalledWith(
      '/app',
      expect.objectContaining({
        platform: 'ios',
        sources: fingerprintResult.fingerprintSources,
        workflow: 'generic',
      })
    );
  });

  it('resolves each platform separately', async () => {
    const { watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);

    await cache.getRuntimeVersionAsync('ios', exp);
    await cache.getRuntimeVersionAsync('android', exp);
    await cache.getRuntimeVersionAsync('android', exp);

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(2);
    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenNthCalledWith(1, {
      projectRoot: '/app',
      platform: 'ios',
    });
    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenNthCalledWith(2, {
      projectRoot: '/app',
      platform: 'android',
    });
  });

  it('shares one in-flight resolution between concurrent requests', async () => {
    const { watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);
    const pending = deferred<ExpoUpdatesRuntimeVersionResult>();
    jest.mocked(resolveRuntimeVersionWithExpoUpdatesAsync).mockReturnValueOnce(pending.promise);

    const requests = [
      cache.getRuntimeVersionAsync('ios', exp),
      cache.getRuntimeVersionAsync('ios', exp),
      cache.getRuntimeVersionAsync('ios', exp),
    ];
    pending.resolve(fingerprintResult);

    await expect(Promise.all(requests)).resolves.toEqual([
      'fingerprint-hash',
      'fingerprint-hash',
      'fingerprint-hash',
    ]);
    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(1);
  });

  it('evicts a failed resolution so the next request retries', async () => {
    const { watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);
    jest
      .mocked(resolveRuntimeVersionWithExpoUpdatesAsync)
      .mockRejectedValueOnce(new Error('expo-updates failed'));

    await expect(cache.getRuntimeVersionAsync('ios', exp)).rejects.toThrow('expo-updates failed');
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(2);
    expect(watchSourcesAsync).toHaveBeenCalledTimes(1);
  });

  it('resolves again when the app config changes', async () => {
    const { watches, watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);

    await cache.getRuntimeVersionAsync('ios', exp);
    jest
      .mocked(resolveRuntimeVersionWithExpoUpdatesAsync)
      .mockResolvedValueOnce({ ...fingerprintResult, runtimeVersion: 'new-hash' });
    await expect(
      cache.getRuntimeVersionAsync('ios', { ...exp, name: 'renamed-app' })
    ).resolves.toBe('new-hash');

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(2);
    // The watcher of the replaced entry is closed.
    expect(watches[0]!.close).toHaveBeenCalled();
  });

  it('resolves again when a watched fingerprint source changes', async () => {
    const { watches, watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);

    await cache.getRuntimeVersionAsync('ios', exp);
    watches[0]!.onChange();
    jest
      .mocked(resolveRuntimeVersionWithExpoUpdatesAsync)
      .mockResolvedValueOnce({ ...fingerprintResult, runtimeVersion: 'new-hash' });

    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('new-hash');
    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(2);
    expect(watches[0]!.close).toHaveBeenCalled();
  });

  it('does not cache a result whose sources changed while it was resolving', async () => {
    const watchSourcesAsync = jest.fn(async () => null);
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);

    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(2);
    expect(watchSourcesAsync).toHaveBeenCalledTimes(2);
  });

  it('disables the cache for the session when the watcher cannot start', async () => {
    const watchSourcesAsync = jest.fn(async () => {
      throw Object.assign(new Error('System limit for number of file watchers reached'), {
        code: 'ENOSPC',
      });
    });
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);

    // The request that hit the failure still gets its freshly resolved value.
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');
    await expect(cache.getRuntimeVersionAsync('android', exp)).resolves.toBe('fingerprint-hash');

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(3);
    // The watcher is not retried once the cache is disabled.
    expect(watchSourcesAsync).toHaveBeenCalledTimes(1);
  });

  it('disables the cache for the session when a running watcher errors', async () => {
    const { watches, watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);

    await cache.getRuntimeVersionAsync('ios', exp);
    await cache.getRuntimeVersionAsync('android', exp);
    watches[0]!.onError(new Error('watcher failed'));

    await cache.getRuntimeVersionAsync('ios', exp);
    await cache.getRuntimeVersionAsync('android', exp);

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(4);
    expect(watches[0]!.close).toHaveBeenCalled();
    expect(watches[1]!.close).toHaveBeenCalled();
    expect(watchSourcesAsync).toHaveBeenCalledTimes(2);
  });

  it('only shares in-flight resolutions for policies other than fingerprint', async () => {
    const { watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);
    jest.mocked(resolveRuntimeVersionWithExpoUpdatesAsync).mockResolvedValue({
      runtimeVersion: '1.0.0',
      fingerprintSources: null,
      workflow: 'managed',
    });

    await expect(
      Promise.all([
        cache.getRuntimeVersionAsync('ios', exp),
        cache.getRuntimeVersionAsync('ios', exp),
      ])
    ).resolves.toEqual(['1.0.0', '1.0.0']);
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('1.0.0');

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(2);
    expect(watchSourcesAsync).not.toHaveBeenCalled();
  });

  it('returns null without caching when expo-updates is not installed', async () => {
    const { watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);
    jest.mocked(resolveRuntimeVersionWithExpoUpdatesAsync).mockResolvedValue(null);

    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBeNull();
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBeNull();

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(2);
    expect(watchSourcesAsync).not.toHaveBeenCalled();
  });

  it('resolves on every request when EXPO_NO_RUNTIME_VERSION_CACHE is set', async () => {
    process.env.EXPO_NO_RUNTIME_VERSION_CACHE = '1';
    const { watchSourcesAsync } = createFakeWatcher();
    const cache = new RuntimeVersionCache('/app', watchSourcesAsync);

    await expect(
      Promise.all([
        cache.getRuntimeVersionAsync('ios', exp),
        cache.getRuntimeVersionAsync('ios', exp),
      ])
    ).resolves.toEqual(['fingerprint-hash', 'fingerprint-hash']);
    await expect(cache.getRuntimeVersionAsync('ios', exp)).resolves.toBe('fingerprint-hash');

    expect(resolveRuntimeVersionWithExpoUpdatesAsync).toHaveBeenCalledTimes(3);
    expect(watchSourcesAsync).not.toHaveBeenCalled();
  });
});
