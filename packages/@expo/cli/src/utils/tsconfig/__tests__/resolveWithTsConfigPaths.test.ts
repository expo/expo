import { resolveWithTsConfigPaths } from '../resolveWithTsConfigPaths';

describe(resolveWithTsConfigPaths, () => {
  it('resolves baseUrl after paths so long as paths do not match', () => {
    const resolver = jest.fn(
      (name) =>
        ({
          'foo/bar': name,
        })[name] as any
    );
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            'alpha/*': ['paths/foo/*'],
          },
          baseUrl: '.',
          hasBaseUrl: true,
        },
        {
          moduleName: 'foo/bar',
          originModulePath: './index.js',
        },
        resolver
      )
    ).toEqual('foo/bar');

    expect(resolver).toBeCalledTimes(1);
    expect(resolver).toHaveBeenNthCalledWith(1, 'foo/bar');
  });
  it('cannot resolve baseUrl if paths were matched and did not resolve', () => {
    const resolver = jest.fn(
      (name) =>
        ({
          'foo/bar': name,
          'paths/foo/bar': null,
        })[name] as any
    );
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            'foo/*': ['paths/foo/*'],
          },
          baseUrl: '.',
          hasBaseUrl: true,
        },
        {
          moduleName: 'foo/bar',
          originModulePath: './index.js',
        },
        resolver
      )
    ).toEqual(null);

    expect(resolver).toBeCalledTimes(1);
    expect(resolver).toHaveBeenNthCalledWith(1, 'paths/foo/bar');
  });
  it('resolves paths with identical matcher as paths', () => {
    const resolver = jest.fn(
      (name) =>
        ({
          'foo/bar': name,
          'paths/foo/bar': null,
        })[name] as any
    );
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '*': ['/*'],
          },
          baseUrl: '.',
          hasBaseUrl: true,
        },
        {
          moduleName: 'foo/bar',
          originModulePath: './index.js',
        },
        resolver
      )
    ).toEqual('foo/bar');

    expect(resolver).toBeCalledTimes(1);
    expect(resolver).toHaveBeenNthCalledWith(1, 'foo/bar');
  });
  it('does not evaluate all resolves paths with identical matcher as paths', () => {
    const resolver = jest.fn(
      (name) =>
        ({
          'foo/bar': name,
          'paths/foo/bar': null,
        })[name] as any
    );
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '*': ['/*'],
          },
          baseUrl: '.',
          hasBaseUrl: true,
        },
        {
          moduleName: 'foo/bar',
          originModulePath: './index.js',
        },
        resolver
      )
    ).toEqual('foo/bar');

    expect(resolver).toBeCalledTimes(1);
    expect(resolver).toHaveBeenNthCalledWith(1, 'foo/bar');
  });
  it('skips resolving less specific matcher if more specific matcher fails to resolve', () => {
    const resolver = jest.fn(
      (name) =>
        ({
          'foo/bar': name,
          'paths/foo/bar': null,
        })[name] as any
    );
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '*': ['/*'],
            'foo/*': ['/paths/foo/*'],
          },
          baseUrl: '.',
          hasBaseUrl: false,
        },
        {
          moduleName: 'foo/bar',
          originModulePath: './index.js',
        },
        resolver
      )
    ).toEqual(null);

    expect(resolver).toBeCalledTimes(1);
    expect(resolver).toHaveBeenNthCalledWith(1, 'paths/foo/bar');
  });

  it('skips baseUrl if paths match same module', () => {
    const resolver = jest.fn(
      (name) =>
        ({
          'foo/bar': name,
          'paths/foo/bar': name,
        })[name] as any
    );
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            'foo/*': ['paths/foo/*'],
          },
          baseUrl: '.',
          hasBaseUrl: true,
        },
        {
          moduleName: 'foo/bar',
          originModulePath: './index.js',
        },
        resolver
      )
    ).toEqual('paths/foo/bar');

    expect(resolver).toBeCalledTimes(1);
    expect(resolver).toHaveBeenNthCalledWith(1, 'paths/foo/bar');
  });

  it('resolves a simple alias', () => {
    const resolver = jest.fn(() => ({}) as any);
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '@foo/*': ['foo/*'],
          },
          baseUrl: '.',
          hasBaseUrl: false,
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
    const resolver = jest.fn(() => ({}) as any);
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '@foo/*': ['foo/*'],
          },
          baseUrl: './src',
          hasBaseUrl: false,
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
    const resolver = jest.fn(() => ({}) as any);
    expect(
      resolveWithTsConfigPaths(
        {
          paths: {
            '@foo/*': ['foo/*'],
          },
          baseUrl: '.',
          hasBaseUrl: false,
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
      const resolver = jest.fn(() => ({}) as any);
      expect(
        resolveWithTsConfigPaths(
          {
            paths: {
              '@foo/*': ['foo/*'],
            },
            baseUrl: '.',
            hasBaseUrl: false,
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
