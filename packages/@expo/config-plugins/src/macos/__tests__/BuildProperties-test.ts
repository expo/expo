import { compileMockModWithResultsAsync } from '../../plugins/__tests__/mockMods';
import { withPodfileProperties } from '../../plugins/macos-plugins';
import {
  updateMacosBuildPropertiesFromConfig,
  updateMacosBuildProperty,
  withJsEnginePodfileProps,
} from '../BuildProperties';

jest.mock('../../plugins/macos-plugins');

describe(withJsEnginePodfileProps, () => {
  const JS_ENGINE_PROP_KEY = 'expo.jsEngine';

  it('set the property from shared `jsEngine` config', async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { jsEngine: 'hermes' },
      {
        plugin: withJsEnginePodfileProps,
        mod: withPodfileProperties,
        modResults: {},
      }
    );
    expect(modResults).toMatchObject({
      [JS_ENGINE_PROP_KEY]: 'hermes',
    });
  });

  it('set the property from platform override `jsEngine`', async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { jsEngine: 'hermes', ios: { jsEngine: 'jsc' } },
      {
        plugin: withJsEnginePodfileProps,
        mod: withPodfileProperties,
        modResults: {},
      }
    );
    expect(modResults).toMatchObject({
      [JS_ENGINE_PROP_KEY]: 'jsc',
    });
  });

  it('overwrite the property if an old property is existed', async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { jsEngine: 'hermes' },
      {
        plugin: withJsEnginePodfileProps,
        mod: withPodfileProperties,
        modResults: { [JS_ENGINE_PROP_KEY]: 'jsc' } as Record<string, string>,
      }
    );
    expect(modResults).toMatchObject({
      [JS_ENGINE_PROP_KEY]: 'hermes',
    });
  });
});

describe(updateMacosBuildPropertiesFromConfig, () => {
  it('should respect `propValueGetter` order', () => {
    const podfileProperties = {};
    const configToPropertyRules = [
      {
        propName: 'expo.jsEngine',
        propValueGetter: (config) => config.ios?.jsEngine ?? config.jsEngine ?? 'NOTFOUND',
      },
    ];

    expect(
      updateMacosBuildPropertiesFromConfig(
        { jsEngine: 'hermes', ios: { jsEngine: 'jsc' } },
        podfileProperties,
        configToPropertyRules
      )
    ).toMatchObject({
      'expo.jsEngine': 'jsc',
    });

    expect(
      updateMacosBuildPropertiesFromConfig(
        { jsEngine: 'jsc' },
        podfileProperties,
        configToPropertyRules
      )
    ).toMatchObject({
      'expo.jsEngine': 'jsc',
    });

    expect(
      updateMacosBuildPropertiesFromConfig({}, podfileProperties, configToPropertyRules)
    ).toMatchObject({
      'expo.jsEngine': 'NOTFOUND',
    });
  });
});

describe(updateMacosBuildProperty, () => {
  it('should merge properties', () => {
    const podfileProperties = {
      foo: 'foo',
      bar: 'bar',
      name: 'oldName',
    };
    expect(updateMacosBuildProperty(podfileProperties, 'name', 'newName')).toEqual({
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
    expect(updateMacosBuildProperty(podfileProperties, 'bar', null)).toEqual({
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
      updateMacosBuildProperty(podfileProperties, 'bar', null, { removePropWhenValueIsNull: true })
    ).toEqual({
      foo: 'foo',
    });
  });
});
