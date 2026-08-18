import type { ExpoConfig } from '@expo/config-types';

import {
  updateAndroidBuildPropertiesFromConfig,
  updateAndroidBuildProperty,
} from '../BuildProperties';
import type { PropertiesItem } from '../Properties';

jest.mock('../../plugins/android-plugins');

const EX_UPDATES_NATIVE_DEBUG_PROP_KEY = 'EX_UPDATES_NATIVE_DEBUG';

describe(updateAndroidBuildPropertiesFromConfig, () => {
  const configToPropertyRules = [
    {
      propName: EX_UPDATES_NATIVE_DEBUG_PROP_KEY,
      propValueGetter: (config: Omit<ExpoConfig, 'name' | 'slug'>) =>
        config?.updates?.useNativeDebug === true ? 'true' : undefined,
    },
  ];

  it('should add property when useNativeDebug is true', () => {
    const gradleProperties: PropertiesItem[] = [];

    expect(
      updateAndroidBuildPropertiesFromConfig(
        { updates: { useNativeDebug: true } },
        gradleProperties,
        configToPropertyRules
      )
    ).toContainEqual({
      type: 'property',
      key: EX_UPDATES_NATIVE_DEBUG_PROP_KEY,
      value: 'true',
    });
  });

  it('should not add property when useNativeDebug is false', () => {
    const gradleProperties: PropertiesItem[] = [];

    expect(
      updateAndroidBuildPropertiesFromConfig(
        { updates: { useNativeDebug: false } },
        gradleProperties,
        configToPropertyRules
      )
    ).not.toContainEqual(
      expect.objectContaining({
        key: EX_UPDATES_NATIVE_DEBUG_PROP_KEY,
      })
    );
  });

  it('should not add property when updates config is not set', () => {
    const gradleProperties: PropertiesItem[] = [];

    expect(
      updateAndroidBuildPropertiesFromConfig({}, gradleProperties, configToPropertyRules)
    ).not.toContainEqual(
      expect.objectContaining({
        key: EX_UPDATES_NATIVE_DEBUG_PROP_KEY,
      })
    );
  });
});

describe(updateAndroidBuildProperty, () => {
  it('should merge properties', () => {
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'bar', value: 'bar' },
      { type: 'property', key: 'name', value: 'oldName' },
    ];
    expect(updateAndroidBuildProperty(gradleProperties, 'name', 'newName')).toEqual([
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'bar', value: 'bar' },
      { type: 'property', key: 'name', value: 'newName' },
    ]);
  });

  it('should keep original property when `value` is null by default', () => {
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'bar', value: 'bar' },
    ];
    expect(updateAndroidBuildProperty(gradleProperties, 'bar', null)).toEqual([
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'bar', value: 'bar' },
    ]);
  });

  it('should remove original property when `value` is null when `removePropWhenValueIsNull` is true', () => {
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'bar', value: 'bar' },
    ];
    expect(
      updateAndroidBuildProperty(gradleProperties, 'bar', null, {
        removePropWhenValueIsNull: true,
      })
    ).toEqual([{ type: 'property', key: 'foo', value: 'foo' }]);
  });

  it('should merge properties when `value` is a string array', () => {
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'somearray', value: `["name1"]` },
    ];
    expect(updateAndroidBuildProperty(gradleProperties, 'somearray', `["name2"]`)).toEqual([
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'somearray', value: `["name1","name2"]` },
    ]);
  });

  it('should merge properties when `value` is an object array', () => {
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'somearray', value: `[{"url": "name1"}]` },
    ];
    expect(updateAndroidBuildProperty(gradleProperties, 'somearray', `[{"url":"name2"}]`)).toEqual([
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'somearray', value: `[{"url":"name1"},{"url":"name2"}]` },
    ]);
  });

  it('should merge properties when `value` is an array but not is the value is already here', () => {
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'somearray', value: `["name1","name2"]` },
    ];
    expect(updateAndroidBuildProperty(gradleProperties, 'somearray', `["name2"]`)).toEqual([
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'somearray', value: `["name1","name2"]` },
    ]);
  });

  it('should merge properties when `value` is an array but not is the value is already here - with objects', () => {
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'somearray', value: `[{"url":"name1"},{"url":"name2"}]` },
    ];
    expect(updateAndroidBuildProperty(gradleProperties, 'somearray', `[{"url":"name2"}]`)).toEqual([
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'somearray', value: `[{"url":"name1"},{"url":"name2"}]` },
    ]);
  });
});
