import { vol } from 'memfs';

import { appleAutolinkConditionMetAsync } from '../autolinkCondition';
import { createMemoizer, _verifyMemoizerFreed } from '../../../memoize';

const projectRoot = '/fake/project';
const nativeRoot = '/fake/project/ios';

function packageJson(name: string, dependencies: Record<string, string> = {}): string {
  return JSON.stringify({ name, version: '0.0.1', dependencies });
}

const withMemoizer = (name: string, fn: () => Promise<void>) =>
  it(name, async () => {
    await createMemoizer().withMemoizer(fn);
    expect(_verifyMemoizerFreed()).toBe(true);
  });

describe(appleAutolinkConditionMetAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  describe('npmPackage', () => {
    withMemoizer('is met when the package is hoisted to the project node_modules', async () => {
      vol.fromNestedJSON(
        {
          'package.json': packageJson('root', { 'react-native-worklets': '*' }),
          node_modules: {
            'react-native-worklets': { 'package.json': packageJson('react-native-worklets') },
          },
        },
        projectRoot
      );

      const met = await appleAutolinkConditionMetAsync(
        { npmPackage: 'react-native-worklets' },
        { appRoot: projectRoot }
      );
      expect(met).toBe(true);
    });

    withMemoizer('is not met when the package is not installed', async () => {
      vol.fromNestedJSON(
        {
          'package.json': packageJson('root'),
          node_modules: {},
        },
        projectRoot
      );

      const met = await appleAutolinkConditionMetAsync(
        { npmPackage: 'react-native-worklets' },
        { appRoot: projectRoot }
      );
      expect(met).toBe(false);
    });

    withMemoizer(
      'is met when the package is only reachable transitively (not hoisted)',
      async () => {
        // worklets is nested under a dependency and not directly under the project's
        // node_modules — the cheap hoist check misses it, the deep-graph fallback finds it.
        vol.fromNestedJSON(
          {
            'package.json': packageJson('root', { 'react-native-reanimated': '*' }),
            node_modules: {
              'react-native-reanimated': {
                'package.json': packageJson('react-native-reanimated', {
                  'react-native-worklets': '*',
                }),
                node_modules: {
                  'react-native-worklets': {
                    'package.json': packageJson('react-native-worklets'),
                  },
                },
              },
            },
          },
          projectRoot
        );

        const met = await appleAutolinkConditionMetAsync(
          { npmPackage: 'react-native-worklets' },
          { appRoot: projectRoot }
        );
        expect(met).toBe(true);
      }
    );

    withMemoizer('is not met when appRoot is missing', async () => {
      const met = await appleAutolinkConditionMetAsync(
        { npmPackage: 'react-native-worklets' },
        {}
      );
      expect(met).toBe(false);
    });
  });

  describe('podfileProperty', () => {
    const condition = {
      podfileProperty: 'expo.camera.barcode-scanner-enabled',
      disabledValue: 'false',
    };

    it('is not met when the property equals the disabled value', async () => {
      vol.fromNestedJSON(
        { 'Podfile.properties.json': JSON.stringify({ [condition.podfileProperty]: 'false' }) },
        nativeRoot
      );
      const met = await appleAutolinkConditionMetAsync(condition, { commandRoot: nativeRoot });
      expect(met).toBe(false);
    });

    it('is met when the property is set to a non-disabled value', async () => {
      vol.fromNestedJSON(
        { 'Podfile.properties.json': JSON.stringify({ [condition.podfileProperty]: 'true' }) },
        nativeRoot
      );
      const met = await appleAutolinkConditionMetAsync(condition, { commandRoot: nativeRoot });
      expect(met).toBe(true);
    });

    it('is met when the properties file or property is absent', async () => {
      vol.fromNestedJSON({ 'Podfile.properties.json': JSON.stringify({}) }, nativeRoot);
      const met = await appleAutolinkConditionMetAsync(condition, { commandRoot: nativeRoot });
      expect(met).toBe(true);
    });
  });
});
