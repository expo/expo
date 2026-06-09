import { updateAndroidProguardRules, updateAndroidSettingsGradle } from '../android';

jest.mock('@expo/config-plugins/build/plugins/android-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins/build/plugins/android-plugins');
  return {
    ...plugins,
    withGradleProperties: jest.fn().mockImplementation((config) => config),
  };
});

describe(updateAndroidProguardRules, () => {
  it('should append new rules', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules, 'append');
    expect(results).toContain(rules);
  });

  it('should append new rules twice', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const rules2 = '-keep public class MyClass';
    let results = updateAndroidProguardRules(contents, rules, 'append');
    results = updateAndroidProguardRules(results, rules2, 'append');
    expect(results).toContain(rules);
    expect(results).toContain(rules2);
  });

  it('should purge previous rules for overwrite mode', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const rules2 = '-keep public class MyClass';
    let results = updateAndroidProguardRules(contents, rules, 'append');
    results = updateAndroidProguardRules(results, rules2, 'overwrite');
    expect(results).not.toContain(rules);
    expect(results).toContain(rules2);
  });

  it('should leave the contents untouched when new rules is null', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules, 'append');
    const updatedRules = updateAndroidProguardRules(results, null, 'append');
    expect(updatedRules).toEqual(results);
  });

  it('should leave the contents untouched when mode is `append` and rules is empty string', () => {
    const contents = '# original rules\n';
    const results = updateAndroidProguardRules(contents, '', 'append');
    expect(results).toEqual(contents);
  });

  it('should purge the sectioned contents when mode is `overwrite` and rules is empty string', () => {
    const contents = `\
# original rules

# @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY)
-printmapping mapping.txt
# @generated end expo-build-properties`;
    const results = updateAndroidProguardRules(contents, '', 'overwrite');
    expect(results).toEqual('# original rules\n');
  });

  it('demonstrate the updated contents', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules, 'append');
    expect(results).toMatchInlineSnapshot(`
      "# original rules

      # @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY)
      -printmapping mapping.txt
      # @generated end expo-build-properties"
    `);
  });
});

describe(updateAndroidSettingsGradle, () => {
  const TEMPLATE_SETTINGS_GRADLE = `\
pluginManagement { includeBuild(expoAutolinking.reactNativeGradlePlugin) }
plugins { id("com.facebook.react.settings") }
rootProject.name = 'helloworld'
`;

  it('should append the includeBuild block when buildFromSource is true', () => {
    const result = updateAndroidSettingsGradle({
      contents: TEMPLATE_SETTINGS_GRADLE,
      buildFromSource: true,
    });
    expect(result).toContain('includeBuild(expoAutolinking.reactNative) {');
    expect(result).toContain('// @generated begin expo-build-properties-react-native-source');
    expect(result).toContain('// @generated end expo-build-properties-react-native-source');
  });

  it('should not append the includeBuild block when buildFromSource is falsy', () => {
    expect(
      updateAndroidSettingsGradle({ contents: TEMPLATE_SETTINGS_GRADLE, buildFromSource: false })
    ).toBe(TEMPLATE_SETTINGS_GRADLE);
    expect(
      updateAndroidSettingsGradle({ contents: TEMPLATE_SETTINGS_GRADLE, buildFromSource: undefined })
    ).toBe(TEMPLATE_SETTINGS_GRADLE);
  });

  it('should be idempotent across repeated prebuilds', () => {
    const once = updateAndroidSettingsGradle({
      contents: TEMPLATE_SETTINGS_GRADLE,
      buildFromSource: true,
    });
    const twice = updateAndroidSettingsGradle({ contents: once, buildFromSource: true });
    expect(twice).toEqual(once);
    expect((twice.match(/includeBuild\(expoAutolinking\.reactNative\) \{/g) ?? []).length).toBe(1);
  });

  it('should remove a previously generated block when buildFromSource is toggled off', () => {
    const added = updateAndroidSettingsGradle({
      contents: TEMPLATE_SETTINGS_GRADLE,
      buildFromSource: true,
    });
    const removed = updateAndroidSettingsGradle({ contents: added, buildFromSource: false });
    expect(removed).toBe(TEMPLATE_SETTINGS_GRADLE);
    expect(removed).not.toContain('includeBuild(expoAutolinking.reactNative) {');
  });
});
