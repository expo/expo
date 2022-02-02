import * as fs from 'fs-extra';
import { vol } from 'memfs';

import { updateTSConfigAsync } from '../updateTSConfig';
jest.mock('../resolveModules');
jest.mock('fs');
jest.mock('resolve-from');

const { resolveBaseTSConfig } = require('../resolveModules');

describe(updateTSConfigAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`bootstraps a config in an Expo project`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '',
    });
    resolveBaseTSConfig.mockImplementationOnce(() => '/node_modules/expo/tsconfig.base.json');

    await updateTSConfigAsync({
      projectRoot: '/',
      tsConfigPath: '/tsconfig.json',
      isBootstrapping: true,
    });

    expect(JSON.parse(await fs.readFile('/tsconfig.json', 'utf8'))).toStrictEqual({
      compilerOptions: {},
      extends: 'expo/tsconfig.base',
    });
  });

  it(`does not update a config in a non-Expo project`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '{ "compilerOptions": { "strict": true } }',
    });
    resolveBaseTSConfig.mockImplementationOnce(() => null);

    await updateTSConfigAsync({
      projectRoot: '/',
      tsConfigPath: '/tsconfig.json',
      isBootstrapping: false,
    });

    expect(JSON.parse(await fs.readFile('/tsconfig.json', 'utf8'))).toStrictEqual({
      compilerOptions: {
        strict: true,
      },
    });
  });

  it(`uses an unversioned config when the versioned config isn't available`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '{ "compilerOptions": {} }',
    });
    resolveBaseTSConfig.mockImplementationOnce(() => null);

    await updateTSConfigAsync({
      projectRoot: '/',
      tsConfigPath: '/tsconfig.json',
      isBootstrapping: true,
    });

    expect(JSON.parse(await fs.readFile('/tsconfig.json', 'utf8'))).toStrictEqual({
      compilerOptions: {
        allowJs: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        jsx: 'react-native',
        lib: ['esnext'],
        moduleResolution: 'node',
        noEmit: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        target: 'esnext',
      },
    });
  });

  it(`does not force the base config to be Expo`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '{ "extends": "foobar", "compilerOptions": { "strict": true } }',
    });
    resolveBaseTSConfig.mockImplementationOnce(() => '/node_modules/expo/tsconfig.base.json');

    await updateTSConfigAsync({
      projectRoot: '/',
      tsConfigPath: '/tsconfig.json',
      isBootstrapping: false,
    });

    expect(JSON.parse(await fs.readFile('/tsconfig.json', 'utf8'))).toStrictEqual({
      extends: 'foobar',
      compilerOptions: {
        strict: true,
      },
    });
  });
});
