import {
  canonicalDimNames,
  canonicalDims,
  currentFingerprint,
  dimId,
  isAmbientVaryScheme,
  readAmbientVaryValue,
} from '../ambient';

let mockExpoConfig: Record<string, unknown> | Error = {};
jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => {
    if (mockExpoConfig instanceof Error) throw mockExpoConfig;
    return { exp: mockExpoConfig, pkg: {} };
  }),
}));

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = { ...originalEnv };
});

describe(readAmbientVaryValue, () => {
  it('reads current env values and distinguishes unset from empty', () => {
    process.env.EXPO_PUBLIC_TEST_VAR = 'value';
    expect(readAmbientVaryValue('env', 'EXPO_PUBLIC_TEST_VAR')).toBe('value');

    process.env.EXPO_PUBLIC_TEST_VAR = '';
    expect(readAmbientVaryValue('env', 'EXPO_PUBLIC_TEST_VAR')).toBe('');

    delete process.env.EXPO_PUBLIC_TEST_VAR;
    expect(readAmbientVaryValue('env', 'EXPO_PUBLIC_TEST_VAR')).toBeUndefined();
  });
});

describe(isAmbientVaryScheme, () => {
  it('accepts known schemes and rejects foreign scheme strings', () => {
    expect(isAmbientVaryScheme('env')).toBe(true);
    expect(isAmbientVaryScheme('expo-config')).toBe(true);
    expect(isAmbientVaryScheme('does-not-exist')).toBe(false);
    expect(isAmbientVaryScheme('constructor')).toBe(false);
  });
});

describe(currentFingerprint, () => {
  it('distinguishes an unset variable from an empty string', async () => {
    delete process.env.EXPO_PUBLIC_TEST_VAR;
    const unset = await currentFingerprint('env', 'EXPO_PUBLIC_TEST_VAR');

    process.env.EXPO_PUBLIC_TEST_VAR = '';
    const empty = await currentFingerprint('env', 'EXPO_PUBLIC_TEST_VAR');

    expect(unset).not.toEqual(empty);
  });

  it('changes with the value and is stable for equal values', async () => {
    process.env.EXPO_PUBLIC_TEST_VAR = 'one';
    const one = await currentFingerprint('env', 'EXPO_PUBLIC_TEST_VAR');
    const oneAgain = await currentFingerprint('env', 'EXPO_PUBLIC_TEST_VAR');

    process.env.EXPO_PUBLIC_TEST_VAR = 'two';
    const two = await currentFingerprint('env', 'EXPO_PUBLIC_TEST_VAR');

    expect(one).toEqual(oneAgain);
    expect(one).not.toEqual(two);
  });

  it('returns null for an unknown scheme, never a fingerprint of an absent value', async () => {
    expect(await currentFingerprint('does-not-exist', 'x')).toBeNull();
  });
});

describe(canonicalDims, () => {
  it('serializes dims sorted and newline-joined, independent of input order', () => {
    const a = canonicalDims([
      { scheme: 'env', name: 'EXPO_PUBLIC_B', fp: '2' },
      { scheme: 'env', name: 'EXPO_PUBLIC_A', fp: '1' },
    ]);
    const b = canonicalDims([
      { scheme: 'env', name: 'EXPO_PUBLIC_A', fp: '1' },
      { scheme: 'env', name: 'EXPO_PUBLIC_B', fp: '2' },
    ]);

    expect(a).toBe(b);
    expect(a).toBe('env:EXPO_PUBLIC_A=1\nenv:EXPO_PUBLIC_B=2');
  });

  it('serializes an empty dim list to an empty string', () => {
    expect(canonicalDims([])).toBe('');
  });
});

describe(canonicalDimNames, () => {
  it('serializes dim names sorted and newline-joined', () => {
    expect(
      canonicalDimNames([
        { scheme: 'env', name: 'EXPO_PUBLIC_B' },
        { scheme: 'env', name: 'EXPO_PUBLIC_A' },
      ])
    ).toBe('env:EXPO_PUBLIC_A\nenv:EXPO_PUBLIC_B');
  });
});

describe(dimId, () => {
  it('joins a dim scheme and name', () => {
    expect(dimId({ scheme: 'env', name: 'EXPO_PUBLIC_A' })).toBe('env:EXPO_PUBLIC_A');
  });
});

describe('expo-config scheme', () => {
  const context = { projectRoot: '/app' };

  // The public config is memoized per process, so each "process" loads a fresh module.
  function loadAmbient(): typeof import('../ambient') {
    let ambient!: typeof import('../ambient');
    jest.isolateModules(() => {
      ambient = require('../ambient');
    });
    return ambient;
  }

  beforeEach(() => {
    mockExpoConfig = { name: 'app', extra: { API_BASE_URL: 'http://localhost:3000' } };
    jest.mocked(require('@expo/config').getConfig).mockClear();
  });

  it('fingerprints the public Expo config of the project', async () => {
    const ambient = loadAmbient();
    const fp = await ambient.currentFingerprint('expo-config', 'exp', context);

    expect(fp).toEqual(expect.any(String));
    expect(require('@expo/config').getConfig).toHaveBeenCalledWith('/app', {
      isPublicConfig: true,
      skipSDKVersionRequirement: true,
    });
  });

  it('changes with the config and is stable for an equal config', async () => {
    const one = await loadAmbient().currentFingerprint('expo-config', 'exp', context);
    const oneAgain = await loadAmbient().currentFingerprint('expo-config', 'exp', context);

    mockExpoConfig = { name: 'app', extra: { API_BASE_URL: 'https://api.example.com' } };
    const two = await loadAmbient().currentFingerprint('expo-config', 'exp', context);

    expect(one).toEqual(oneAgain);
    expect(one).not.toEqual(two);
  });

  it('evaluates the config once per project root', async () => {
    const ambient = loadAmbient();
    await ambient.currentFingerprint('expo-config', 'exp', context);
    await ambient.currentFingerprint('expo-config', 'exp', context);

    expect(require('@expo/config').getConfig).toHaveBeenCalledTimes(1);
  });

  it('returns null without a project root, for unknown names, or when the config fails to load', async () => {
    const ambient = loadAmbient();
    expect(await ambient.currentFingerprint('expo-config', 'exp')).toBeNull();
    expect(await ambient.currentFingerprint('expo-config', 'private', context)).toBeNull();

    mockExpoConfig = new Error('Invalid app.config.ts');
    expect(await loadAmbient().currentFingerprint('expo-config', 'exp', context)).toBeNull();
  });
});
