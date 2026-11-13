import { parsePropertiesFile, propertiesListToString } from '../Properties';

describe(parsePropertiesFile, () => {
  it('keeps a value that continues on the next line', () => {
    const contents = [
      'org.gradle.jvmargs=-Xmx2048m \\',
      '    -XX:+HeapDumpOnOutOfMemoryError',
      'android.useAndroidX=true',
    ].join('\n');

    const props = parsePropertiesFile(contents);

    expect(props).toEqual([
      {
        type: 'property',
        key: 'org.gradle.jvmargs',
        value: '-Xmx2048m \\\n    -XX:+HeapDumpOnOutOfMemoryError',
      },
      { type: 'property', key: 'android.useAndroidX', value: 'true' },
    ]);
    expect(propertiesListToString(props)).toBe(contents);
  });

  it('keeps the whole key when a line has no separator', () => {
    expect(parsePropertiesFile('android.enableJetifier')).toEqual([
      { type: 'property', key: 'android.enableJetifier', value: '' },
    ]);
  });
});
