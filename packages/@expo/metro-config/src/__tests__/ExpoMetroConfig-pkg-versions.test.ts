import { vol } from 'memfs';

import { getDefaultConfig } from '../ExpoMetroConfig';
import { getPkgVersion } from '../utils/getPkgVersion';

jest.mock('../utils/getPkgVersion', () => {
  const actual = jest.requireActual('../utils/getPkgVersion');
  return { getPkgVersion: jest.fn(actual.getPkgVersion) };
});

const projectRoot = '/';

beforeEach(() => {
  vol.fromJSON(
    {
      'package.json': JSON.stringify({ name: 'hello-world', private: true }),
      'node_modules/react-native/package.json': '',
      'node_modules/react-native-reanimated/package.json': JSON.stringify({
        name: 'react-native-reanimated',
        version: '4.1.0',
      }),
      'node_modules/react-native-worklets/package.json': JSON.stringify({
        name: 'react-native-worklets',
        version: '0.6.0',
      }),
      'node_modules/@babel/runtime/package.json': JSON.stringify({
        name: '@babel/runtime',
        version: '7.25.0',
      }),
    },
    projectRoot
  );
});

afterEach(() => {
  vol.reset();
});

describe('package versions', () => {
  it('passes the installed versions to the transformer options', () => {
    const { transformer } = getDefaultConfig(projectRoot);
    expect(transformer).toMatchObject({
      reanimatedVersion: '4.1.0',
      workletsVersion: '0.6.0',
      enableBabelRuntime: '7.25.0',
    });
  });

  it('looks up react-native-worklets through react-native-reanimated', () => {
    // `react-native-worklets` is a peer dependency of `react-native-reanimated` and is not always
    // installed next to it, so Reanimated is passed as the fallback resolution root.
    getDefaultConfig(projectRoot);
    expect(getPkgVersion).toHaveBeenCalledWith(
      projectRoot,
      'react-native-worklets',
      'react-native-reanimated'
    );
  });
});
