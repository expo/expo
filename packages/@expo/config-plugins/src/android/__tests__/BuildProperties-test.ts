import { compileMockModWithResultsAsync } from '../../plugins/__tests__/mockMods';
import { withGradleProperties } from '../../plugins/android-plugins';
import {
  updateAndroidBuildPropertiesFromConfig,
  updateAndroidBuildProperty,
  withJsEngineGradleProps,
} from '../BuildProperties';
import { parsePropertiesFile, PropertiesItem } from '../Properties';

jest.mock('../../plugins/android-plugins');

const HERMES_PROP_KEY = 'hermesEnabled';

describe(withJsEngineGradleProps, () => {
  it('set the property from shared `jsEngine` config', async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { jsEngine: 'hermes' },
      {
        plugin: withJsEngineGradleProps,
        mod: withGradleProperties,
        modResults: [],
      }
    );
    expect(modResults).toContainEqual({
      type: 'property',
      key: HERMES_PROP_KEY,
      value: 'true',
    });
  });

  it('set the property from platform override `jsEngine`', async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      { jsEngine: 'hermes', android: { jsEngine: 'jsc' } },
      {
        plugin: withJsEngineGradleProps,
        mod: withGradleProperties,
        modResults: [],
      }
    );
    expect(modResults).toContainEqual({
      type: 'property',
      key: HERMES_PROP_KEY,
      value: 'false',
    });
  });

  it('overwrite the property if an old property is existed', async () => {
    const originalGradleProperties = parsePropertiesFile(`
android.useAndroidX=true
android.enableJetifier=true
hermesEnabled=false
`);

    const { modResults } = await compileMockModWithResultsAsync(
      { android: { jsEngine: 'hermes' } },
      {
        plugin: withJsEngineGradleProps,
        mod: withGradleProperties,
        modResults: originalGradleProperties,
      }
    );
    expect(modResults).toContainEqual({
      type: 'property',
      key: HERMES_PROP_KEY,
      value: 'true',
    });
  });
});

describe(updateAndroidBuildPropertiesFromConfig, () => {
  it('should respect `propValueGetter` order', () => {
    const gradleProperties = [];
    const configToPropertyRules = [
      {
        propName: HERMES_PROP_KEY,
        propValueGetter: (config) =>
          ((config.android?.jsEngine ?? config.jsEngine ?? 'hermes') === 'hermes').toString(),
      },
    ];

    expect(
      updateAndroidBuildPropertiesFromConfig(
        { jsEngine: 'hermes', android: { jsEngine: 'jsc' } },
        gradleProperties,
        configToPropertyRules
      )
    ).toContainEqual({
      type: 'property',
      key: HERMES_PROP_KEY,
      value: 'false',
    });

    expect(
      updateAndroidBuildPropertiesFromConfig(
        { jsEngine: 'jsc' },
        gradleProperties,
        configToPropertyRules
      )
    ).toContainEqual({
      type: 'property',
      key: HERMES_PROP_KEY,
      value: 'false',
    });

    expect(
      updateAndroidBuildPropertiesFromConfig({}, gradleProperties, configToPropertyRules)
    ).toContainEqual({
      type: 'property',
      key: HERMES_PROP_KEY,
      value: 'true',
    });
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
