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

  it('splits the key from the value at `:` or whitespace', () => {
    expect(parsePropertiesFile(['a:1', 'b 2', 'c = 3', 'd : 4'].join('\n'))).toEqual([
      { type: 'property', key: 'a', value: '1' },
      { type: 'property', key: 'b', value: '2' },
      { type: 'property', key: 'c', value: '3' },
      { type: 'property', key: 'd', value: '4' },
    ]);
  });

  it('joins a key that continues on the next line', () => {
    const props = parsePropertiesFile(['my\\=key\\', '    value', 'next=1'].join('\n'));

    expect(props).toEqual([
      { type: 'property', key: 'my\\=keyvalue', value: '' },
      { type: 'property', key: 'next', value: '1' },
    ]);
    expect(parsePropertiesFile(propertiesListToString(props))).toEqual(props);
  });

  it('drops a continuation backslash at the end of the file', () => {
    expect(parsePropertiesFile('key\\=value\\')).toEqual([
      { type: 'property', key: 'key\\=value', value: '' },
    ]);
    expect(parsePropertiesFile('foo\\')).toEqual([{ type: 'property', key: 'foo', value: '' }]);
  });

  it('does not continue a line when the backslash escapes trailing whitespace', () => {
    const props = parsePropertiesFile(['foo\\ ', 'bar=1', 'k v\\ ', 'next=2'].join('\n'));

    expect(props).toEqual([
      { type: 'property', key: 'foo\\ ', value: '' },
      { type: 'property', key: 'bar', value: '1' },
      { type: 'property', key: 'k', value: 'v\\ ' },
      { type: 'property', key: 'next', value: '2' },
    ]);
    expect(parsePropertiesFile(propertiesListToString(props))).toEqual(props);
  });

  it('splits only at space, tab, or form feed', () => {
    expect(parsePropertiesFile(['key =value', 'key\u000bvalue'].join('\n'))).toEqual([
      { type: 'property', key: 'key ', value: 'value' },
      { type: 'property', key: 'key\u000bvalue', value: '' },
    ]);
  });

  it('reads a line that starts with `!` as a comment', () => {
    expect(parsePropertiesFile('! this is a comment')).toEqual([
      { type: 'comment', value: 'this is a comment' },
    ]);
  });
});
