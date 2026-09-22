'use strict';

const { autolinkConditionLabel, autolinkConditionMet } = require('../autolink-gate');

/** expo-camera's barcode scanner, the only gated product shipping today. */
const BARCODE_SCANNER = {
  podfileProperty: 'expo.camera.barcode-scanner-enabled',
  disabledValue: 'false',
};

const met = (condition, options) => autolinkConditionMet(condition, options);

describe('a condition on a sibling pod', () => {
  const condition = { podName: 'ExpoCamera' };

  it('is met when the install declares that pod', () => {
    expect(met(condition, { declaredPodNames: new Set(['ExpoModulesCore', 'ExpoCamera']) })).toBe(
      true
    );
  });

  it('is not met when nothing declares it', () => {
    expect(met(condition, { declaredPodNames: new Set(['ExpoModulesCore']) })).toBe(false);
  });

  // Declared, not linked: a pod the install declares but cannot build still
  // decides the gate, exactly as CocoaPods' registry of declared products does.
  // Reading a set of already-linked pods instead would make the answer depend on
  // how far the emit loop had got.
  it('is not met when the caller passes no declared pods', () => {
    expect(met(condition)).toBe(false);
    expect(met(condition, {})).toBe(false);
  });
});

describe('a condition on an npm package', () => {
  const condition = { npmPackage: 'expo-camera' };

  it('is met when the app autolinks that package', () => {
    expect(met(condition, { autolinkedPackages: new Set(['expo', 'expo-camera']) })).toBe(true);
  });

  it('is not met when it does not', () => {
    expect(met(condition, { autolinkedPackages: new Set(['expo']) })).toBe(false);
    expect(met(condition)).toBe(false);
  });
});

describe('a condition on a Podfile property', () => {
  // Opt-out, not opt-in: the product links unless the app turned it off. Reading
  // this the other way round drops a module from every app that never set it.
  it('is met when the app declares no such property', () => {
    expect(met(BARCODE_SCANNER, { podfileProperties: { 'expo.jsEngine': 'hermes' } })).toBe(true);
    expect(met(BARCODE_SCANNER, { podfileProperties: {} })).toBe(true);
    expect(met(BARCODE_SCANNER)).toBe(true);
  });

  it('is not met when the property holds the disabled value', () => {
    expect(
      met(BARCODE_SCANNER, {
        podfileProperties: { 'expo.camera.barcode-scanner-enabled': 'false' },
      })
    ).toBe(false);
  });

  it('is met when the property holds any other value', () => {
    for (const value of ['true', 'FALSE', '', 'no']) {
      expect(
        met(BARCODE_SCANNER, {
          podfileProperties: { 'expo.camera.barcode-scanner-enabled': value },
        })
      ).toBe(true);
    }
  });

  // Nothing can equal the value the product never declared, so only a property
  // that is actually set can satisfy such a condition.
  it('declaring no disabled value is met only while the property is set', () => {
    const condition = { podfileProperty: 'expo.camera.barcode-scanner-enabled' };
    expect(met(condition, { podfileProperties: {} })).toBe(false);
    expect(
      met(condition, { podfileProperties: { 'expo.camera.barcode-scanner-enabled': 'false' } })
    ).toBe(true);
  });

  // Ruby reads an unset property and an absent value as the same nil, so a
  // product disabled by null is disabled by default there. Comparing undefined
  // against null instead would link it here and withhold it under CocoaPods.
  it('declaring null as its disabled value reads the same as declaring none', () => {
    const condition = {
      podfileProperty: 'expo.camera.barcode-scanner-enabled',
      disabledValue: null,
    };
    expect(met(condition, { podfileProperties: {} })).toBe(false);
    expect(met(condition)).toBe(false);
    expect(
      met(condition, { podfileProperties: { 'expo.camera.barcode-scanner-enabled': 'false' } })
    ).toBe(true);
  });

  it('is not met when the property itself is set to null and nothing is disabled', () => {
    expect(
      met(
        { podfileProperty: 'expo.camera.barcode-scanner-enabled' },
        { podfileProperties: { 'expo.camera.barcode-scanner-enabled': null } }
      )
    ).toBe(false);
  });
});

describe('a condition declaring several keys', () => {
  const condition = {
    podName: 'ExpoCamera',
    npmPackage: 'expo-camera',
    podfileProperty: 'expo.camera.barcode-scanner-enabled',
    disabledValue: 'false',
  };
  const options = {
    autolinkedPackages: new Set(['expo-camera']),
    podfileProperties: {},
  };

  it('is decided by its pod name alone', () => {
    expect(met(condition, { ...options, declaredPodNames: new Set(['ExpoCamera']) })).toBe(true);
    expect(met(condition, { ...options, declaredPodNames: new Set() })).toBe(false);
  });

  it('falls through to its npm package only when it names no pod', () => {
    const withoutPodName = { npmPackage: condition.npmPackage, ...BARCODE_SCANNER };
    expect(met(withoutPodName, { ...options, declaredPodNames: new Set() })).toBe(true);
    expect(met(withoutPodName, { ...options, autolinkedPackages: new Set() })).toBe(false);
  });

  it('reaches its Podfile property only when it names neither', () => {
    expect(met(BARCODE_SCANNER, { ...options, declaredPodNames: new Set() })).toBe(true);
  });
});

describe('a condition naming nothing to gate on', () => {
  it.each([[undefined], [null], [{}], [{ disabledValue: 'false' }], ['expo-camera'], [42]])(
    'is not met (%p)',
    (condition) => {
      expect(
        met(condition, {
          declaredPodNames: new Set(['ExpoCamera']),
          autolinkedPackages: new Set(['expo-camera']),
          podfileProperties: { 'expo.camera.barcode-scanner-enabled': 'true' },
        })
      ).toBe(false);
    }
  );
});

describe('the label of a condition', () => {
  it('is whichever key decides it', () => {
    expect(autolinkConditionLabel({ podName: 'ExpoCamera', npmPackage: 'expo-camera' })).toBe(
      'ExpoCamera'
    );
    expect(autolinkConditionLabel({ npmPackage: 'expo-camera', ...BARCODE_SCANNER })).toBe(
      'expo-camera'
    );
    expect(autolinkConditionLabel(BARCODE_SCANNER)).toBe('expo.camera.barcode-scanner-enabled');
  });

  it('is null when it names nothing', () => {
    expect(autolinkConditionLabel({})).toBeNull();
    expect(autolinkConditionLabel(undefined)).toBeNull();
  });
});
