import * as fs from 'fs-extra';
import { vol } from 'memfs';

import { updateTSConfigAsync } from '../updateTSConfig';

jest.mock('../../../../log');

describe(updateTSConfigAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`bootstraps a config in an Expo project`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '',
    });

    await updateTSConfigAsync({
      tsConfigPath: '/tsconfig.json',
    });

    expect(JSON.parse(await fs.readFile('/tsconfig.json', 'utf8'))).toStrictEqual({
      compilerOptions: {},
      extends: 'expo/tsconfig.base',
    });
  });

  it(`does not force the base config to be Expo`, async () => {
    vol.fromJSON({
      '/tsconfig.json': '{ "extends": "foobar", "compilerOptions": { "strict": true } }',
    });

    await updateTSConfigAsync({
      tsConfigPath: '/tsconfig.json',
    });

    expect(JSON.parse(await fs.readFile('/tsconfig.json', 'utf8'))).toStrictEqual({
      extends: 'foobar',
      compilerOptions: {
        strict: true,
      },
    });
  });
});
