import { vol } from 'memfs';

import { loadTsConfigPathsAsync } from '../loadTsConfigPaths';

jest.mock('../evaluateTsConfig', () => ({
  evaluateTsConfig: jest.fn((ts, filepath) => {
    return (require('@expo/json-file') as typeof import('@expo/json-file')).default.read(filepath, {
      json5: true,
    });
  }),
  importTypeScriptFromProjectOptionally: jest.fn(() => ({})),
}));

describe(loadTsConfigPathsAsync, () => {
  beforeEach(() => {
    vol.reset();
  });
  it(`returns null if tsconfig doesn't exist`, async () => {
    vol.fromJSON({}, '/');
    expect(await loadTsConfigPathsAsync('/')).toBeNull();
  });
  it(`returns just baseUrl`, async () => {
    vol.fromJSON(
      {
        'jsconfig.json': '{}',
      },
      '/'
    );
    expect(await loadTsConfigPathsAsync('/')).toEqual({ baseUrl: undefined, paths: undefined });
  });
  it(`returns jsconfig paths`, async () => {
    vol.fromJSON(
      {
        'jsconfig.json': JSON.stringify({
          compilerOptions: {
            baseUrl: 'src',
            paths: {
              '@foo/*': ['foo/*'],
            },
          },
        }),
      },
      '/'
    );
    expect(await loadTsConfigPathsAsync('/')).toEqual({
      baseUrl: '/src',
      paths: { '@foo/*': ['foo/*'] },
    });
  });
  it(`returns tsconfig before jsconfig`, async () => {
    vol.fromJSON(
      {
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            baseUrl: 'src',
            paths: {
              '@foo/*': ['foo/*'],
            },
          },
        }),
        'jsconfig.json': JSON.stringify({}),
      },
      '/'
    );
    expect(await loadTsConfigPathsAsync('/')).toEqual({
      baseUrl: '/src',
      paths: { '@foo/*': ['foo/*'] },
    });
  });
});
