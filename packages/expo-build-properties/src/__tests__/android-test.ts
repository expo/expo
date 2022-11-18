import { updateAndroidProguardRules } from '../android';

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
