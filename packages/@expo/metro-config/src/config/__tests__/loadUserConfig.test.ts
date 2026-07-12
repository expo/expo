import { getDefaultConfig } from '../../ExpoMetroConfig';
import { loadUserConfig } from '../loadUserConfig';
import { resolveMetroUserConfig } from '../resolveMetroUserConfig';

jest.mock('../../ExpoMetroConfig', () => ({
  getDefaultConfig: jest.fn(),
}));
jest.mock('../../loadBabelConfig', () => ({
  resolveBabelrcName: jest.fn(() => undefined),
}));
jest.mock('../resolveMetroUserConfig', () => ({
  resolveMetroUserConfig: jest.fn(),
}));
jest.mock('@expo/metro/metro-config', () => ({
  mergeConfig: jest.fn((base, overrides) => ({
    ...base,
    ...overrides,
    resolver: { ...base.resolver, ...overrides.resolver },
    transformer: { ...base.transformer, ...overrides.transformer },
  })),
}));

const projectRoot = '/project';

function fakeDefaultConfig() {
  return {
    projectRoot,
    watchFolders: [projectRoot],
    transformer: {},
    // `getDefaultConfig` neutralizes Metro's `useWatchman: true` default to `null`, which the
    // `@expo/metro-file-map` fork coalesces to `false` (Node watcher)
    resolver: { useWatchman: null },
  } as any;
}

beforeEach(() => {
  (getDefaultConfig as jest.Mock).mockReturnValue(fakeDefaultConfig());
});

describe(loadUserConfig, () => {
  it('keeps the neutralized `useWatchman` default when no user config exists', async () => {
    (resolveMetroUserConfig as jest.Mock).mockResolvedValue({ isEmpty: true, config: {} });

    const config = await loadUserConfig({ projectRoot } as any);

    expect(config.resolver.useWatchman).toBeNull();
  });

  it('keeps the neutralized `useWatchman` default when the user config does not set it', async () => {
    (resolveMetroUserConfig as jest.Mock).mockResolvedValue({
      isEmpty: false,
      config: { resolver: {} },
    });

    const config = await loadUserConfig({ projectRoot } as any);

    expect(config.resolver.useWatchman).toBeNull();
  });

  // Regression test for https://github.com/expo/expo/issues/47662:
  // the merged value used to be rewritten (`true` -> `null`) and then coerced to `false` by the
  // file-map fork, so an explicit `resolver.useWatchman: true` could never re-enable Watchman.
  it('preserves an explicit `resolver.useWatchman: true` so Watchman can be re-enabled', async () => {
    (resolveMetroUserConfig as jest.Mock).mockResolvedValue({
      isEmpty: false,
      config: { resolver: { useWatchman: true } },
    });

    const config = await loadUserConfig({ projectRoot } as any);

    expect(config.resolver.useWatchman).toBe(true);
  });

  it('preserves an explicit `resolver.useWatchman: false`', async () => {
    (resolveMetroUserConfig as jest.Mock).mockResolvedValue({
      isEmpty: false,
      config: { resolver: { useWatchman: false } },
    });

    const config = await loadUserConfig({ projectRoot } as any);

    expect(config.resolver.useWatchman).toBe(false);
  });
});
