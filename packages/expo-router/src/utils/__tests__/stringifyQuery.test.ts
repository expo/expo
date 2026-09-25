import { stringifyQuery } from '../stringifyQuery';

/**
 * The behaviour of `queryString.stringify(object, { sort: false })` from `query-string@7`, which
 * `stringifyQuery` replaces. The RFC 3986 encoding is what rules out `URLSearchParams`.
 */
describe(stringifyQuery, () => {
  it('returns an empty string for nothing to serialize', () => {
    expect(stringifyQuery(undefined)).toBe('');
    expect(stringifyQuery(null)).toBe('');
    expect(stringifyQuery({})).toBe('');
  });

  it('preserves insertion order rather than sorting keys', () => {
    expect(stringifyQuery({ z: 'last', a: 'first' })).toBe('z=last&a=first');
  });

  it('omits undefined values but keeps empty strings', () => {
    expect(stringifyQuery({ a: undefined, b: 'kept' })).toBe('b=kept');
    expect(stringifyQuery({ a: '', b: 'kept' })).toBe('a=&b=kept');
  });

  it('serializes null as a bare key', () => {
    expect(stringifyQuery({ a: null, b: '1' })).toBe('a&b=1');
  });

  it('repeats the key for arrays and omits empty ones', () => {
    expect(stringifyQuery({ a: ['1', '2'] })).toBe('a=1&a=2');
    expect(stringifyQuery({ a: [], b: '1' })).toBe('b=1');
    expect(stringifyQuery({ a: ['1', undefined, null] })).toBe('a=1&a');
  });

  it('percent-encodes per RFC 3986, not application/x-www-form-urlencoded', () => {
    // The distinction that rules out URLSearchParams: space is %20 (not '+')
    // and '*' is %2A (not left bare).
    expect(stringifyQuery({ params: '[object Object]' })).toBe('params=%5Bobject%20Object%5D');
    expect(stringifyQuery({ a: 'start end' })).toBe('a=start%20end');
    expect(stringifyQuery({ a: "!'()*" })).toBe('a=%21%27%28%29%2A');
    expect(stringifyQuery({ 'key with space': 'x' })).toBe('key%20with%20space=x');
  });

  it('encodes unicode and reserved characters in both keys and values', () => {
    expect(stringifyQuery({ 'ünïcode': 'jane & co' })).toBe('%C3%BCn%C3%AFcode=jane%20%26%20co');
    expect(stringifyQuery({ a: 'x=y', b: 'a?b#c' })).toBe('a=x%3Dy&b=a%3Fb%23c');
  });

  it('coerces non-string primitives the way encodeURIComponent does', () => {
    expect(stringifyQuery({ n: 0, f: false, x: 3.14 })).toBe('n=0&f=false&x=3.14');
  });

  it('drops a `__proto__` key, as query-string did', () => {
    // query-string copied params into a plain object before serializing, which turned
    // `copy['__proto__'] = value` into a prototype assignment and lost the key.
    // A computed key is needed here: a literal `__proto__:` sets the prototype instead.
    const params = { a: '1', ['__proto__']: 'x', b: '2' };
    expect(Object.keys(params)).toEqual(['a', '__proto__', 'b']);
    expect(stringifyQuery(params)).toBe('a=1&b=2');
    expect(stringifyQuery({ ['__proto__']: null })).toBe('');
  });

  it('drops segments that encode to nothing', () => {
    // An empty key with a null value encodes to '', which must not leave a stray '&'.
    expect(stringifyQuery({ '': null, a: '1' })).toBe('a=1');
    expect(stringifyQuery({ a: '1', '': null })).toBe('a=1');
    expect(stringifyQuery({ '': [null] })).toBe('');
  });
});
