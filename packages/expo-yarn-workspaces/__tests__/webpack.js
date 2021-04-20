const expoWebpackConfig = require('@expo/webpack-config');
const path = require('path');

jest.mock('@expo/webpack-config', () => {
  return jest.fn(() => {
    return {
      resolve: {},
    };
  });
});

const { createWebpackConfigAsync } = require('../webpack');

const fakeEnv = {
  projectRoot: path.resolve(__dirname, '../workspace-template'),
  mode: 'development',
};

describe('expo-yarn-workspaces createWebpackConfigAsync()', () => {
  it('sets up symlink resolution', async () => {
    const config = await createWebpackConfigAsync(
      {
        projectRoot: __dirname,
        mode: 'development',
      },
      undefined
    );

    expect(config.resolve.symlinks).toEqual(true);
  });

  it('sets up transpilation for workspace packages', async () => {
    await createWebpackConfigAsync(fakeEnv, undefined);

    const [lastEnvArgument] = expoWebpackConfig.mock.calls[expoWebpackConfig.mock.calls.length - 1];

    expect(lastEnvArgument.babel.dangerouslyAddModulePathsToTranspile).toEqual(
      expect.arrayContaining([
        expect.stringContaining('second-package'),
        expect.stringContaining('first-package'),
      ])
    );
  });

  it('allows custom package transpilation to be configured', async () => {
    await createWebpackConfigAsync(
      {
        ...fakeEnv,
        babel: {
          dangerouslyAddModulePathsToTranspile: ['module-to-transpile'],
        },
      },
      undefined
    );

    const [lastEnvArgument] = expoWebpackConfig.mock.calls[expoWebpackConfig.mock.calls.length - 1];

    expect(lastEnvArgument.babel.dangerouslyAddModulePathsToTranspile).toEqual(
      expect.arrayContaining([
        expect.stringContaining('module-to-transpile'),
        expect.stringContaining('first-package'),
        expect.stringContaining('second-package'),
      ])
    );
  });
});
