import { resolveWithTsConfigPaths } from '../resolveWithTsConfigPaths';

describe(resolveWithTsConfigPaths, () => {
  it('resolves a simple alias', () => {
    const resolver = jest.fn(() => ({} as any));
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '@foo/*': ['foo/*'],
          },
          baseUrl: '.',
        },
        {
          moduleName: '@foo/bar',
          originModulePath: './foo/bar',
        },
        resolver
      )
    ).not.toEqual(null);

    expect(resolver).toHaveBeenCalledWith('foo/bar');
  });
  it('resolves an alias with baseUrl', () => {
    const resolver = jest.fn(() => ({} as any));
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '@foo/*': ['foo/*'],
          },
          baseUrl: './src',
        },
        {
          moduleName: '@foo/bar',
          originModulePath: './foo/bar',
        },
        resolver
      )
    ).not.toEqual(null);

    expect(resolver).toHaveBeenCalledWith('src/foo/bar');
  });
  it(`skips resolving if the origin module is inside the node_modules directory`, () => {
    const resolver = jest.fn(() => ({} as any));
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '@foo/*': ['foo/*'],
          },
          baseUrl: '.',
        },
        {
          moduleName: '@foo/bar',
          originModulePath: './node_modules/foo/bar',
        },
        resolver
      )
    ).toEqual(null);

    expect(resolver).not.toHaveBeenCalled();
  });
  it(`skips resolving if the module name is absolute or relative`, () => {
    ['/foo/bar', './foo/bar'].forEach((moduleName) => {
      const resolver = jest.fn(() => ({} as any));
      expect(
        resolveWithTsConfigPaths(
          {
            paths: {
              '@foo/*': ['foo/*'],
            },
            baseUrl: '.',
          },
          {
            moduleName,
            originModulePath: '/foo/bar',
          },
          resolver
        )
      ).toEqual(null);

      expect(resolver).not.toHaveBeenCalled();
    });
  });
});
