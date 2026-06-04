import { vol } from 'memfs';

import { appleAutolinkConditionMetAsync } from '../autolinkCondition';

const nativeRoot = '/fake/project/ios';

describe(appleAutolinkConditionMetAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  describe('npmPackage', () => {
    it('is met when the package is in the resolved dependency set', async () => {
      const met = await appleAutolinkConditionMetAsync(
        { npmPackage: 'react-native-worklets' },
        { resolvedDependencyNames: new Set(['react-native-worklets']) }
      );
      expect(met).toBe(true);
    });

    it('is not met when the package is not in the resolved set', async () => {
      const met = await appleAutolinkConditionMetAsync(
        { npmPackage: 'react-native-worklets' },
        { resolvedDependencyNames: new Set(['react-native-reanimated']) }
      );
      expect(met).toBe(false);
    });

    it('is not met when the resolved set is absent', async () => {
      const met = await appleAutolinkConditionMetAsync({ npmPackage: 'react-native-worklets' }, {});
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

    it('is not met when commandRoot is absent', async () => {
      const met = await appleAutolinkConditionMetAsync(condition, {});
      expect(met).toBe(false);
    });
  });
});
