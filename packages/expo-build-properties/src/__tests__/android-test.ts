import { updateAndroidProguardRules } from '../android';

describe(updateAndroidProguardRules, () => {
  it('should append new rules', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules);
    expect(results).toContain(rules);
  });

  it('should append new rules only once', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules);
    expect(results).toContain(rules);

    const reentrantResults = updateAndroidProguardRules(results, rules);
    expect(reentrantResults).toBe(null);
  });

  it('should replace old generated rules when new rules changed', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules);
    expect(results).toContain(rules);

    const updatedRules = '-optimizationpasses 5';
    const updatedResults = updateAndroidProguardRules(results, updatedRules);
    expect(updatedResults).toContain(updatedRules);
    expect(updatedResults).not.toContain(rules);
  });

  it('should cleanup old generated rules when new rules is null', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules);
    expect(results).toContain(rules);

    const updatedResults = updateAndroidProguardRules(results, null);
    expect(updatedResults).toEqual(contents);
  });

  it('demonstrate the updated contents', () => {
    const contents = '# original rules\n';
    const rules = '-printmapping mapping.txt';
    const results = updateAndroidProguardRules(contents, rules);
    expect(results).toMatchInlineSnapshot(`
      "# original rules

      # @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY) sync-d9f9c3a609c5f05f8adceb450e41cdf56a3c6805
      -printmapping mapping.txt
      # @generated end expo-build-properties"
    `);
  });
});
