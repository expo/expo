import resolveFrom from 'resolve-from';

import { loadBabelConfigPlugins } from '../babelConfigLoader';

jest.mock('resolve-from', () => ({
  __esModule: true,
  default: { silent: jest.fn() },
}));

const projectRoot = '/tmp/project';
const mockLoadPartialConfigSync = jest.fn();

jest.mock('/tmp/babel-core.js', () => ({ loadPartialConfigSync: mockLoadPartialConfigSync }), {
  virtual: true,
});

describe(loadBabelConfigPlugins, () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('resolves Babel through the project Expo and Expo Metro config packages', () => {
    jest.mocked(resolveFrom.silent).mockImplementation((fromDirectory, request) => {
      if (fromDirectory === projectRoot && request === 'expo/package.json') {
        return '/tmp/project/node_modules/expo/package.json';
      }
      if (
        fromDirectory === '/tmp/project/node_modules/expo' &&
        request === '@expo/metro-config/package.json'
      ) {
        return '/tmp/project/node_modules/expo/node_modules/@expo/metro-config/package.json';
      }
      if (
        fromDirectory === '/tmp/project/node_modules/expo/node_modules/@expo/metro-config' &&
        request === '@babel/core'
      ) {
        return '/tmp/babel-core.js';
      }
      return undefined;
    });
    const plugins = [
      {
        file: { request: 'react-native-worklets/plugin' },
        options: { bundleMode: true },
      },
    ];
    mockLoadPartialConfigSync.mockReturnValue({ options: { plugins } });

    expect(loadBabelConfigPlugins(projectRoot)).toEqual(plugins);
    expect(mockLoadPartialConfigSync).toHaveBeenCalledWith({
      cwd: projectRoot,
      filename: '/tmp/project/index.js',
      root: projectRoot,
    });
  });

  it('fails safely when a nested package cannot be resolved', () => {
    jest.mocked(resolveFrom.silent).mockReturnValue(undefined);

    expect(loadBabelConfigPlugins(projectRoot)).toBeNull();
  });

  it('fails safely when Babel cannot load the project config', () => {
    jest.mocked(resolveFrom.silent).mockImplementation((_fromDirectory, request) => {
      if (request === 'expo/package.json') {
        return '/tmp/project/node_modules/expo/package.json';
      }
      if (request === '@expo/metro-config/package.json') {
        return '/tmp/project/node_modules/@expo/metro-config/package.json';
      }
      if (request === '@babel/core') {
        return '/tmp/babel-core.js';
      }
      return undefined;
    });
    mockLoadPartialConfigSync.mockImplementation(() => {
      throw new Error('Invalid Babel config');
    });

    expect(loadBabelConfigPlugins(projectRoot)).toBeNull();
  });
});
