import {
  correctReactNativeTvVersion,
  reactNativeTvPresentInPackageDependencies,
  reactNativeTvVersionMatchesBundled,
} from '../reactNativeTv';

describe(reactNativeTvPresentInPackageDependencies, () => {
  it('returns true when react-native is aliased to react-native-tvos', () => {
    expect(
      reactNativeTvPresentInPackageDependencies({
        'react-native': 'npm:react-native-tvos@0.83.0-0',
      })
    ).toBe(true);
  });

  it('returns false when react-native is a plain version', () => {
    expect(reactNativeTvPresentInPackageDependencies({ 'react-native': '0.85.3' })).toBe(false);
  });

  it('returns false when react-native is aliased to a different package', () => {
    expect(
      reactNativeTvPresentInPackageDependencies({
        'react-native': 'npm:some-other-fork@1.2.3',
      })
    ).toBe(false);
  });

  it('returns false when react-native is missing from the dependency map', () => {
    expect(reactNativeTvPresentInPackageDependencies({ expo: '55.0.0' })).toBe(false);
  });

  it('returns false for an empty map', () => {
    expect(reactNativeTvPresentInPackageDependencies({})).toBe(false);
  });

  it('returns false when dependencies is undefined', () => {
    expect(reactNativeTvPresentInPackageDependencies(undefined)).toBe(false);
  });
});

describe(correctReactNativeTvVersion, () => {
  it('derives the <major>.<minor>-stable dist-tag from a plain react-native version', () => {
    expect(correctReactNativeTvVersion('0.85.3')).toBe('npm:react-native-tvos@0.85-stable');
  });

  it('routes prerelease react-native versions to the `next` dist-tag', () => {
    expect(correctReactNativeTvVersion('0.85.3-rc.1')).toBe('npm:react-native-tvos@next');
    expect(correctReactNativeTvVersion('0.86.0-canary.20260514-abc1234')).toBe(
      'npm:react-native-tvos@next'
    );
  });

  it('handles caret-prefixed stable react-native versions', () => {
    expect(correctReactNativeTvVersion('^0.85.3')).toBe('npm:react-native-tvos@0.85-stable');
  });

  it('treats a caret range whose minimum is a prerelease as @next', () => {
    expect(correctReactNativeTvVersion('^0.85.3-rc.1')).toBe('npm:react-native-tvos@next');
  });

  it('throws on a non-semver react-native version', () => {
    expect(() => correctReactNativeTvVersion('not-a-version')).toThrow(/not a valid semver/);
  });
});

describe(reactNativeTvVersionMatchesBundled, () => {
  it('returns true when installed and bundled share major.minor', () => {
    expect(reactNativeTvVersionMatchesBundled('0.85.3-0', '0.85.3')).toBe(true);
    expect(reactNativeTvVersionMatchesBundled('0.85.0-0', '0.85.3')).toBe(true);
    expect(reactNativeTvVersionMatchesBundled('0.85.7-rc.4', '0.85.3')).toBe(true);
  });

  it('returns false when minors differ', () => {
    expect(reactNativeTvVersionMatchesBundled('0.83.0-0', '0.85.3')).toBe(false);
  });

  it('returns false when majors differ', () => {
    expect(reactNativeTvVersionMatchesBundled('1.85.0', '0.85.3')).toBe(false);
  });

  it('returns false for unparseable inputs', () => {
    expect(reactNativeTvVersionMatchesBundled('not-a-version', '0.85.3')).toBe(false);
    expect(reactNativeTvVersionMatchesBundled('0.85.3-0', 'not-a-version')).toBe(false);
  });
});
