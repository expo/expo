import { filterPackages } from '../../checks/ReactNativeDirectoryCheck';

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
});
