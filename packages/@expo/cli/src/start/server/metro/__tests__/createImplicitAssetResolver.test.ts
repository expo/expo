import { vol } from 'memfs';

import { createImplicitAssetResolver } from '../createImplicitAssetResolver';

const projectRoot = '/app';

class FailedToResolvePathError extends Error {
  candidates = {};
}

function createFailedResolutionError() {
  return new FailedToResolvePathError('Unable to resolve');
}

function setup({ assetExts = ['png'] }: { assetExts?: string[] } = {}) {
  const fileSystem = {
    exists: jest.fn((filePath: string) => filePath === '/app/known.lottie'),
    addOrModify: jest.fn(),
  };
  const config = { resolver: { assetExts } };
  const strictResolve = jest.fn((_moduleName: string): any => {
    throw createFailedResolutionError();
  });
  const resolver = createImplicitAssetResolver({
    config: config as any,
    roots: [projectRoot],
    getStrictResolver: () => strictResolve,
    getFileSystem: () => fileSystem as any,
  });
  const context: any = {
    originModulePath: '/app/src/index.js',
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json'],
    assetExts: new Set(assetExts),
  };
  return { resolver, fileSystem, config, strictResolve, context };
}

describe(createImplicitAssetResolver, () => {
  beforeEach(() => {
    vol.reset();
  });

  it('resolves an existing file with an unregistered extension as an asset', () => {
    vol.fromJSON({ '/app/src/animation.lottie': 'data' });
    const { resolver, fileSystem, config, context } = setup();

    expect(resolver(context, './animation.lottie', 'ios')).toEqual({
      type: 'assetFiles',
      filePaths: ['/app/src/animation.lottie'],
    });
    // The file is added to the file map so Metro can hash and serve it.
    expect(fileSystem.addOrModify).toHaveBeenCalledWith(
      '/app/src/animation.lottie',
      expect.arrayContaining([expect.any(Number), 4])
    );
    // The extension is registered so the dev server's asset endpoint accepts it.
    expect(config.resolver.assetExts).toContain('lottie');
  });

  it('does not re-add files that are already in the file map', () => {
    vol.fromJSON({ '/app/known.lottie': 'data' });
    const { resolver, fileSystem, context } = setup();
    expect(resolver(context, '../known.lottie', 'ios')).toEqual({
      type: 'assetFiles',
      filePaths: ['/app/known.lottie'],
    });
    expect(fileSystem.addOrModify).not.toHaveBeenCalled();
  });

  it('prefers the standard resolution when it succeeds', () => {
    vol.fromJSON({ '/app/src/Button.web': 'data' });
    const { resolver, strictResolve, context } = setup();
    strictResolve.mockReturnValueOnce({ type: 'sourceFile', filePath: '/app/src/Button.web.tsx' });
    expect(resolver(context, './Button.web', 'web')).toEqual({
      type: 'sourceFile',
      filePath: '/app/src/Button.web.tsx',
    });
  });

  it('skips source extensions, registered asset extensions, and extensionless specifiers', () => {
    vol.fromJSON({ '/app/src/a.js': '', '/app/src/a.png': '', '/app/src/a': '' });
    const { resolver, strictResolve, context } = setup();
    expect(resolver(context, './a.js', 'ios')).toBeNull();
    expect(resolver(context, './a.png', 'ios')).toBeNull();
    expect(resolver(context, './a', 'ios')).toBeNull();
    expect(strictResolve).not.toHaveBeenCalled();
  });

  it('skips bare module specifiers', () => {
    const { resolver, context } = setup();
    expect(resolver(context, 'some-package/file.lottie', 'ios')).toBeNull();
  });

  it('skips files that do not exist or are directories', () => {
    vol.fromJSON({ '/app/src/folder.thing/index.js': '' });
    const { resolver, context } = setup();
    expect(resolver(context, './missing.lottie', 'ios')).toBeNull();
    expect(resolver(context, './folder.thing', 'ios')).toBeNull();
  });

  it('skips files outside of the watched roots', () => {
    vol.fromJSON({ '/outside/animation.lottie': 'data' });
    const { resolver, context } = setup();
    expect(resolver(context, '/outside/animation.lottie', 'ios')).toBeNull();
  });
});
