const baseResolveRequest = jest.fn((_context: unknown, moduleName: string) => ({
  type: 'sourceFile',
  filePath: moduleName,
}));

jest.mock('../../metro.config.js', () => ({ resolver: { resolveRequest: baseResolveRequest } }));

const { resolver } = require('../../layout-registry.metro.config.js');

function resolve(moduleName: string) {
  return resolver.resolveRequest({}, moduleName, 'android');
}

describe('layout registry Metro config', () => {
  it.each([
    ['a POSIX absolute path', '/project/node_modules/metro-runtime/src/modules/empty-module.js'],
    [
      'a Windows absolute path',
      'D:\\project\\node_modules\\metro-runtime\\src\\modules\\empty-module.js',
    ],
    ['a Windows absolute path with forward slashes', 'C:/project/src/widgets/Widget.android.tsx'],
    ['a UNC path', '\\\\server\\share\\project\\src\\widgets\\Widget.android.tsx'],
    ['a relative path', './Widget.android.tsx'],
    ['a parent relative path', '../widgets/Widget.android.tsx'],
  ])('resolves %s as a file', (_, moduleName) => {
    expect(resolve(moduleName)).toEqual({ type: 'sourceFile', filePath: moduleName });
    expect(baseResolveRequest).toHaveBeenCalledWith({}, moduleName, 'android');
  });

  it.each(['react', 'react-native', '@expo/ui/jetpack-compose'])(
    'stubs the bare specifier %s',
    (moduleName) => {
      expect(resolve(moduleName)).toEqual({ type: 'empty' });
      expect(baseResolveRequest).not.toHaveBeenCalled();
    }
  );

  it('stubs expo-widgets with the layout registry stub', () => {
    expect(resolve('expo-widgets')).toEqual({
      type: 'sourceFile',
      filePath: expect.stringMatching(/layout-registry-stub\.ts$/),
    });
  });
});
