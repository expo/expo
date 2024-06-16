import { vol } from 'memfs';

import { getDefaultConfig } from '../ExpoMetroConfig';

const projectRoot = '/';
const consoleError = console.error;

function mockProject() {
  vol.fromJSON(
    {
      'package.json': JSON.stringify({
        name: 'hello-world',
        private: true,
      }),
      'node_modules/expo-asset/tools/hashAssetFiles.js': '',
      'node_modules/react-native/package.json': '',
      'node_modules/react-native/node_modules/metro-runtime/package.json': '',
      'node_modules/react-native/node_modules/metro-runtime/src/modules/asyncRequire.js': '',
      'node_modules/metro-react-native-babel-transformer/package.json': '',
    },
    projectRoot
  );
}
describe(getDefaultConfig, () => {
  beforeEach(() => {
    mockProject();
  });
  afterEach(() => {
    vol.reset();
  });
  afterAll(() => {
    console.error = consoleError;
  });

  it('loads default configuration', () => {
    expect(getDefaultConfig(projectRoot)).toEqual(
      expect.objectContaining({
        projectRoot,
        resolver: expect.objectContaining({
          resolverMainFields: expect.arrayContaining(['react-native', 'browser', 'main']),
          sourceExts:
            expect.not.arrayContaining(['expo.ts', 'expo.tsx', 'expo.js', 'expo.jsx', 'jsx']) &&
            expect.arrayContaining(['json']),
          assetExts: expect.not.arrayContaining(['json']),
        }),
      })
    );
  });

  it('loads default configuration for apps', () => {
    expect(getDefaultConfig(projectRoot).resolver?.sourceExts).toEqual(
      expect.not.arrayContaining(['expo.js'])
    );
  });
});
