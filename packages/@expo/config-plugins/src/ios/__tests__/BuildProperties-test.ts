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

  it('should keep original property when `value` is null by default', () => {
    const podfileProperties = {
      foo: 'foo',
      bar: 'bar',
    };
    expect(updateIosBuildProperty(podfileProperties, 'bar', null)).toEqual({
      foo: 'foo',
      bar: 'bar',
    });
  });

  it('should remove original property when `value` is null when `removePropWhenValueIsNull` is true', () => {
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
