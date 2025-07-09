import { DEFAULT_PACKAGES_TO_IGNORE, filterPackages } from '../ReactNativeDirectoryCheck';

describe('filterPackages', () => {
  it('returns all packages if no ignored packages are provided', () => {
    expect(filterPackages(['a', 'b', 'c'], [])).toEqual(['a', 'b', 'c']);
  });

  it('filters packages by regex', () => {
    expect(filterPackages(['a', 'b', 'c'], [/a/])).toEqual(['b', 'c']);
  });

  it('filters packages by string', () => {
    expect(filterPackages(['a', 'b', 'c'], ['a'])).toEqual(['b', 'c']);
  });

  it('filters predefined packages to ignore', () => {
    expect(
      filterPackages(
        [
          'react-native',
          'babel-runtime',
          '@expo/metro-runtime',
          '@expo-google-fonts/inter',
          '@types/lodash',
        ],
        DEFAULT_PACKAGES_TO_IGNORE
      )
    ).toEqual([]);
  });
});
