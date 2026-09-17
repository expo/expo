import {
  canonicalDimNames,
  canonicalDims,
  currentFingerprint,
  dimId,
  isAmbientVaryScheme,
  readAmbientVaryValue,
} from '../ambient';

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
