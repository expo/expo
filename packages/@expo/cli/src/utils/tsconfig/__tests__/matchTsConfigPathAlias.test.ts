import { matchTsConfigPathAlias } from '../matchTsConfigPathAlias';

describe(matchTsConfigPathAlias, () => {
  it('matches a simple alias', () => {
    const pathsKeys = ['@foo/*'];
    const moduleName = '@foo/bar';
    expect(matchTsConfigPathAlias(pathsKeys, moduleName)).toEqual({
      text: '@foo/*',
      star: 'bar',
    });
  });
  it('matches a simple alias with a dot', () => {
    const pathsKeys = ['@foo/*'];
    const moduleName = '@foo/bar.baz';
    expect(matchTsConfigPathAlias(pathsKeys, moduleName)).toEqual({
      text: '@foo/*',
      star: 'bar.baz',
    });
  });
  it('matches a simple alias with a dot and a slash', () => {
    const pathsKeys = ['@foo/*'];
    const moduleName = '@foo/bar.baz/qux';
    expect(matchTsConfigPathAlias(pathsKeys, moduleName)).toEqual({
      text: '@foo/*',
      star: 'bar.baz/qux',
    });
  });
});
