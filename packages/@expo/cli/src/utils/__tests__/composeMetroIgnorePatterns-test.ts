import { composeMetroIgnorePatterns } from '../composeMetroIgnorePatterns';

describe(composeMetroIgnorePatterns, () => {
  it.each([[null], [undefined], [[]]])('returns a never-matching regex for %p', (input) => {
    expect(composeMetroIgnorePatterns(input).test('foo')).toBe(false);
    expect(composeMetroIgnorePatterns(input).test('')).toBe(false);
  });

  it('returns an equivalent regex for a single regex input', () => {
    const composed = composeMetroIgnorePatterns(/foo/);
    expect(composed.test('xfoox')).toBe(true);
    expect(composed.test('bar')).toBe(false);
  });

  it('unwraps a single-element array', () => {
    const composed = composeMetroIgnorePatterns([/foo/]);
    expect(composed.test('xfoox')).toBe(true);
    expect(composed.test('bar')).toBe(false);
  });

  it('matches the union of multiple patterns', () => {
    const composed = composeMetroIgnorePatterns([/foo/, /bar/, /^baz/]);
    expect(composed.test('xfoox')).toBe(true);
    expect(composed.test('xbarx')).toBe(true);
    expect(composed.test('baz123')).toBe(true);
    expect(composed.test('123baz')).toBe(false);
    expect(composed.test('quux')).toBe(false);
  });

  it('uses non-capturing groups when composing', () => {
    expect(composeMetroIgnorePatterns([/foo/, /bar/]).source).toMatchInlineSnapshot(
      `"(?:foo)|(?:bar)"`
    );
  });

  it('throws when patterns have different flags', () => {
    expect(() => composeMetroIgnorePatterns([/foo/i, /bar/])).toThrow(/different flags/);
  });

  it('preserves shared flags', () => {
    const composed = composeMetroIgnorePatterns([/foo/i, /bar/i]);
    expect(composed.flags).toBe('i');
    expect(composed.test('FOO')).toBe(true);
    expect(composed.test('BAR')).toBe(true);
  });

  describe('decoration stripping', () => {
    it.each<[RegExp, string]>([
      [/.*foo/, 'foo'],
      [/.*?foo/, 'foo'],
      [/^.*foo/, 'foo'],
      [/^.*?foo/, 'foo'],
      [/[\s\S]*foo/, 'foo'],
      [/[\s\S]*?foo/, 'foo'],
      [/foo.*/, 'foo'],
      [/foo.*?/, 'foo'],
      [/foo.*$/, 'foo'],
      [/foo.*?$/, 'foo'],
      [/foo[\s\S]*/, 'foo'],
      [/foo[\s\S]*?$/, 'foo'],
      [/.*foo.*/, 'foo'],
      [/^.*foo.*$/, 'foo'],
      [/[\s\S]*foo[\s\S]*/, 'foo'],
    ])('strips redundant decoration: %p -> %p', (input, expected) => {
      expect(composeMetroIgnorePatterns(input).source).toBe(expected);
    });

    it.each<[RegExp, string]>([
      [/foo\.*/, 'foo\\.*'],
      [/foo\\.*/, 'foo\\\\'],
      [/foo[a-z*]/, 'foo[a-z*]'],
    ])('respects escapes and character classes: %p -> %p', (input, expected) => {
      expect(composeMetroIgnorePatterns(input).source).toBe(expected);
    });

    it.each<[RegExp]>([[/^.*$/], [/.*/], [/^.*/], [/.*$/]])(
      'returns the original source when stripping would be degenerate: %p',
      (input) => {
        expect(composeMetroIgnorePatterns(input).source).toBe(input.source);
      }
    );

    it('produces a regex semantically equivalent to the original', () => {
      const before = /.*bare-expo\/e2e.*/;
      const after = composeMetroIgnorePatterns(before);
      const inputs = [
        'apps/bare-expo/e2e/test.js',
        'apps/bare-expo/e2e',
        'apps/other/file.js',
        '',
        'bare-expo/e2e',
      ];
      for (const input of inputs) {
        expect(after.test(input)).toBe(before.test(input));
      }
    });

    it('preserves union semantics across the array after stripping', () => {
      const inputs = [/.*foo.*/, /^bar/, /baz\/.*$/];
      const composed = composeMetroIgnorePatterns(inputs);
      const samples = ['xfoox', 'bar123', '123bar', 'baz/x', 'baz', 'qux', 'foo'];
      for (const sample of samples) {
        const expected = inputs.some((re) => re.test(sample));
        expect(composed.test(sample)).toBe(expected);
      }
    });
  });

  describe('ordering', () => {
    it('places start-anchored alternatives first', () => {
      expect(composeMetroIgnorePatterns([/foo/, /^bar/, /baz/]).source).toMatchInlineSnapshot(
        `"(?:^bar)|(?:foo)|(?:baz)"`
      );
    });

    it('places leading-wildcard alternatives last when they cannot be stripped', () => {
      expect(composeMetroIgnorePatterns([/.*$/, /^bar/, /baz/]).source).toMatchInlineSnapshot(
        `"(?:^bar)|(?:baz)|(?:.*$)"`
      );
    });
  });
});
