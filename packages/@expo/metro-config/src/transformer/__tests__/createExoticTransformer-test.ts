import { vol } from 'memfs';
import path from 'path';

import { createExoticTransformer } from '../createExoticTransformer';

const projectRoot = '/';

jest.mock('../createMultiRuleTransformer', () => {
  const all = jest.requireActual('../createMultiRuleTransformer');

  return {
    ...all,
    getBabelCoreFromProject() {
      return {};
    },
    loaders: Object.keys(all.loaders).reduce(
      (prev, curr) => ({
        ...prev,
        [curr]: jest.fn(
          //   all.loaders[curr]
          () => ({})
        ),
      }),
      {}
    ),
  };
});

function mockProject() {
  vol.fromJSON(
    {
      [path.join(__dirname, '../getCacheKey.ts')]: '',
      'package.json': JSON.stringify({
        name: 'hello-world',
        private: true,
      }),
      'node_modules/expo-asset/tools/hashAssetFiles.js': '',
      'node_modules/react-native/package.json': '',
      'node_modules/babel-preset-fbjs/package.json': '',
      'node_modules/metro-react-native-babel-transformer/package.json': '',
    },
    projectRoot
  );
}
describe(createExoticTransformer, () => {
  beforeEach(() => {
    mockProject();
  });
  afterEach(() => {
    vol.reset();
  });
  const projectRoot = '/';
  it(`adds support for custom node_modules`, () => {
    const { transform } = createExoticTransformer({
      nodeModulesPaths: ['node_modules', 'foobar'],
      transpileModules: ['bacon-super-custom'],
    });

    function loaderCalledWith(loaderName: string, filename: string) {
      const props = { filename, src: '', options: { projectRoot } };
      const { _ruleName } = transform(props);
      console.log(_ruleName);
      expect(require('../createMultiRuleTransformer').loaders[loaderName]).toHaveBeenLastCalledWith(
        props
      );
    }

    // Application code
    loaderCalledWith('app', 'src/Screen.js');
    loaderCalledWith('app', 'App.js');
    // We manually add the module `bacon-super-custom` to the list of node modules that must be transformed with babel.
    loaderCalledWith('app', 'node_modules/bacon-super-custom/dist/base.tsx');

    // React native proper
    loaderCalledWith('reactNativeModule', 'node_modules/react-native/index.js');

    // Some expo packages
    loaderCalledWith('expoModule', 'node_modules/expo-assets/index.js');
    loaderCalledWith('expoModule', 'node_modules/@expo/browser-polyfill/src/index.ts');

    // Known community matchers
    loaderCalledWith('untranspiledModule', 'node_modules/@sentry/react-native/index.ts');
    loaderCalledWith('untranspiledModule', 'node_modules/styled-components/index.ts');

    // Remaining modules are skipped, ensure this is core packages like `react`.
    loaderCalledWith('passthroughModule', 'node_modules/react/index.ts');
    // Users may encounter this react native module which doesn't match an expected pattern.
    loaderCalledWith('passthroughModule', 'node_modules/@stripe/stripe-react-native/index.ts');
  });
});
