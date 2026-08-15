import { parsePackageSpecifier } from '../parsePackageSpecifier';

describe(parsePackageSpecifier, () => {
  it('parses names', () => {
    expect(parsePackageSpecifier('test')).toBe('test');
    expect(parsePackageSpecifier('test@test')).toBe('test');
    expect(parsePackageSpecifier('')).toBe(null);
    expect(parsePackageSpecifier('@test')).toBe(null);
  });

  it('parses scoped names', () => {
    expect(parsePackageSpecifier('@a/b')).toBe('@a/b');
    expect(parsePackageSpecifier('@a/b@test')).toBe('@a/b');
    expect(parsePackageSpecifier('@a/')).toBe(null);
    expect(parsePackageSpecifier('@a')).toBe(null);
  });
});
