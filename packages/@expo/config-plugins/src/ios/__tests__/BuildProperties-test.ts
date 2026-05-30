import type { ExpoConfig } from '@expo/config-types';

import { updateIosBuildPropertiesFromConfig, updateIosBuildProperty } from '../BuildProperties';

jest.mock('../../plugins/ios-plugins');

const UPDATES_NATIVE_DEBUG_PROP_KEY = 'updatesNativeDebug';

describe(updateIosBuildPropertiesFromConfig, () => {
  const configToPropertyRules = [
    {
      propName: UPDATES_NATIVE_DEBUG_PROP_KEY,
      propValueGetter: (config: Omit<ExpoConfig, 'name' | 'slug'>) =>
        config?.updates?.useNativeDebug === true ? 'true' : undefined,
    },
  ];

  it('should add property when useNativeDebug is true', () => {
    const podfileProperties = {};

    expect(
      updateIosBuildPropertiesFromConfig(
        { updates: { useNativeDebug: true } },
        podfileProperties,
        configToPropertyRules
      )
    ).toMatchObject({
      [UPDATES_NATIVE_DEBUG_PROP_KEY]: 'true',
    });
  });

  it('should not add property when useNativeDebug is false', () => {
    const podfileProperties = {};

    expect(
      updateIosBuildPropertiesFromConfig(
        { updates: { useNativeDebug: false } },
        podfileProperties,
        configToPropertyRules
      )
    ).not.toHaveProperty(UPDATES_NATIVE_DEBUG_PROP_KEY);
  });

  it('should not add property when updates config is not set', () => {
    const podfileProperties = {};

    expect(
      updateIosBuildPropertiesFromConfig({}, podfileProperties, configToPropertyRules)
    ).not.toHaveProperty(UPDATES_NATIVE_DEBUG_PROP_KEY);
  });
});

describe(updateIosBuildProperty, () => {
  it('should merge properties', () => {
    const podfileProperties = {
      foo: 'foo',
      bar: 'bar',
      name: 'oldName',
    };
    expect(updateIosBuildProperty(podfileProperties, 'name', 'newName')).toEqual({
      foo: 'foo',
      bar: 'bar',
      name: 'newName',
    });
  });

  it('should remove property when value is null', () => {
    const podfileProperties = {
      foo: 'foo',
      bar: 'bar',
    };
    expect(updateIosBuildProperty(podfileProperties, 'bar', null)).toEqual({
      foo: 'foo',
    });
  });

  it('should remove property when value is undefined', () => {
    const podfileProperties = {
      'expo.useHermesV1': 'true',
      other: 'value',
    };
    expect(updateIosBuildProperty(podfileProperties, 'expo.useHermesV1', undefined)).toEqual({
      other: 'value',
    });
  });

  it('should write (not delete) property when value is an empty string', () => {
    const podfileProperties = {
      foo: 'foo',
      bar: 'bar',
    };
    expect(updateIosBuildProperty(podfileProperties, 'bar', '')).toEqual({
      foo: 'foo',
      bar: '',
    });
  });

  it('should still remove property when removePropWhenValueIsNull is passed (backwards compat)', () => {
    const podfileProperties = {
      foo: 'foo',
      bar: 'bar',
    };
    expect(
      updateIosBuildProperty(podfileProperties, 'bar', null, { removePropWhenValueIsNull: true })
    ).toEqual({
      foo: 'foo',
    });
  });
});
