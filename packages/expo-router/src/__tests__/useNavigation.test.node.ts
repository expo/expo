import { resolveParentId } from '../useNavigation';

describe(resolveParentId, () => {
  it(`resolves nullish`, () => {
    expect(resolveParentId('/', null)).toBe(null);
    expect(resolveParentId('/foo', undefined)).toBe(null);
  });
  it(`normalizes an absolute path`, () => {
    expect(resolveParentId('/foo', '/foo')).toBe('/foo');
    expect(resolveParentId('/foo/bar', '/somn/else.tsx')).toBe('/somn/else');
    expect(resolveParentId('/foo/bar', '/')).toBe('/');
  });
  it(`normalizes a relative path`, () => {
    expect(resolveParentId('/foo/bar', '../bat')).toBe('/foo/bat');
    expect(resolveParentId('/foo/bar', '../../bat')).toBe('/bat');
    expect(resolveParentId('/foo/value', './bat')).toBe('/foo/value/bat');
    // normalizes
    expect(resolveParentId('/foo/bar', '../../bat.tsx')).toBe('/bat');
  });
  it(`asserts an invalid normalization`, () => {
    expect(() => resolveParentId('/', '../..')).toThrow('Cannot resolve');
    expect(() => resolveParentId('', '..')).toThrow('Cannot resolve');
  });
});
