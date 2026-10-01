import type { AndroidConfig } from 'expo/config-plugins';

import { setBundleInDebugProperty } from '../withGradlePropertiesPlugin';

type PropertiesItem = AndroidConfig.Properties.PropertiesItem;

const propertyValue = (items: PropertiesItem[], key: string): string | undefined =>
  items.find(
    (item): item is Extract<PropertiesItem, { type: 'property' }> =>
      item.type === 'property' && item.key === key
  )?.value;

const BUNDLE_IN_DEBUG = 'expo.brownfield.bundleInDebug';

describe('setBundleInDebugProperty', () => {
  it('writes the property so the Gradle plugin forwards the debug bundle into the AAR', () => {
    const result = setBundleInDebugProperty([], true);

    expect(propertyValue(result, BUNDLE_IN_DEBUG)).toBe('true');
  });

  it('does not add the property for a project that never enabled the option', () => {
    const result = setBundleInDebugProperty([], false);

    expect(propertyValue(result, BUNDLE_IN_DEBUG)).toBeUndefined();
  });

  it('flips a previously written property back to false', () => {
    const enabled = setBundleInDebugProperty([], true);
    const disabled = setBundleInDebugProperty(enabled, false);

    // gradle.properties survives prebuild, so a stale `true` would keep embedding the bundle
    // after the option is removed from app.json.
    expect(propertyValue(disabled, BUNDLE_IN_DEBUG)).toBe('false');
  });

  it('is idempotent across repeated prebuilds', () => {
    const once = setBundleInDebugProperty([], true);
    const twice = setBundleInDebugProperty(once, true);

    expect(twice).toEqual(once);
    expect(
      twice.filter((item) => item.type === 'property' && item.key === BUNDLE_IN_DEBUG)
    ).toHaveLength(1);
  });

  it('preserves unrelated properties', () => {
    const existing: PropertiesItem[] = [
      { type: 'property', key: 'expo.gif.enabled', value: 'true' },
      { type: 'comment', value: 'keep me' },
    ];

    const result = setBundleInDebugProperty(existing, true);

    expect(propertyValue(result, 'expo.gif.enabled')).toBe('true');
    expect(result.some((item) => item.type === 'comment' && item.value === 'keep me')).toBe(true);
  });
});
