import { vol } from 'memfs';

import { appleAutolinkConditionMet } from '../autolinkCondition';

const nativeRoot = '/fake/project/ios';

describe(appleAutolinkConditionMet, () => {
  afterEach(() => {
    vol.reset();
  });

  describe('npmPackage', () => {
    it('is met when the package is in the resolved dependency set', () => {
      expect(
        appleAutolinkConditionMet(
          { npmPackage: 'react-native-worklets' },
          { resolvedDependencyNames: new Set(['react-native-worklets']) }
        )
      ).toBe(true);
    });

    it('is not met when the package is not in the resolved set', () => {
      expect(
        appleAutolinkConditionMet(
          { npmPackage: 'react-native-worklets' },
          { resolvedDependencyNames: new Set(['react-native-reanimated']) }
        )
      ).toBe(false);
    });

    it('is not met when the resolved set is absent', () => {
      expect(appleAutolinkConditionMet({ npmPackage: 'react-native-worklets' }, {})).toBe(false);
    });
  });

  describe('podfileProperty', () => {
    const condition = {
      podfileProperty: 'expo.camera.barcode-scanner-enabled',
      disabledValue: 'false',
    };

    it('is not met when the property equals the disabled value', () => {
      vol.fromNestedJSON(
        { 'Podfile.properties.json': JSON.stringify({ [condition.podfileProperty]: 'false' }) },
        nativeRoot
      );
      expect(appleAutolinkConditionMet(condition, { commandRoot: nativeRoot })).toBe(false);
    });

    it('is met when the property is set to a non-disabled value', () => {
      vol.fromNestedJSON(
        { 'Podfile.properties.json': JSON.stringify({ [condition.podfileProperty]: 'true' }) },
        nativeRoot
      );
      expect(appleAutolinkConditionMet(condition, { commandRoot: nativeRoot })).toBe(true);
    });

    it('is met when the properties file or property is absent', () => {
      vol.fromNestedJSON({ 'Podfile.properties.json': JSON.stringify({}) }, nativeRoot);
      expect(appleAutolinkConditionMet(condition, { commandRoot: nativeRoot })).toBe(true);
    });

    it('is not met when commandRoot is absent', () => {
      expect(appleAutolinkConditionMet(condition, {})).toBe(false);
    });
  });
});
