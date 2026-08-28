import {
  assertValidFontFaces,
  assertValidFontFamilyDefinitions,
  normalizeStyle,
  normalizeWeight,
  resolveFaceStyle,
  resolveFaceWeight,
} from '../fontFaceValidation';

describe('assertValidFontFaces', () => {
  it('rejects an empty or non-string fontFamily', () => {
    expect(() => assertValidFontFaces('', [{ path: 'a.ttf' }])).toThrow(
      expect.objectContaining({ code: 'ERR_FONT_API' })
    );
    // @ts-expect-error: testing a non-string fontFamily
    expect(() => assertValidFontFaces(123, [{ path: 'a.ttf' }])).toThrow(
      expect.objectContaining({ code: 'ERR_FONT_API' })
    );
  });

  it('rejects a face with a missing path', () => {
    // @ts-expect-error: testing a face with no `path`
    expect(() => assertValidFontFaces('Family', [{}])).toThrow(/path/);
    expect(() =>
      // @ts-expect-error: testing a face with no `path`
      assertValidFontFaces('Family', [{ weight: 400 }])
    ).toThrow(/path/);
  });

  it('rejects two faces that declare the same weight and style', () => {
    expect(() =>
      assertValidFontFaces('Family', [
        { path: 'a.ttf', weight: 400, style: 'normal' },
        { path: 'b.ttf', weight: '400', style: 'normal' },
      ])
    ).toThrow('two faces');
  });

  it('accepts equal weights when a face leaves style undeclared', () => {
    expect(() =>
      assertValidFontFaces('Family', [
        { path: 'a.ttf', weight: 400, style: 'normal' },
        { path: 'b.ttf', weight: 400 },
      ])
    ).not.toThrow();
  });

  it('accepts a valid single-face definition', () => {
    expect(() => assertValidFontFaces('Family', [{ path: 'a.ttf', weight: 400 }])).not.toThrow();
  });
});

describe('normalizeWeight', () => {
  it('converts named and string weights to numbers', () => {
    expect(normalizeWeight(400)).toBe(400);
    expect(normalizeWeight('700')).toBe(700);
    expect(normalizeWeight('normal')).toBe(400);
    expect(normalizeWeight('bold')).toBe(700);
  });

  it('returns undefined for a range or an unparseable value', () => {
    expect(normalizeWeight('100 900')).toBeUndefined();
    expect(normalizeWeight('400abc')).toBeUndefined();
  });
});

describe('normalizeStyle', () => {
  it('matches the CSS keyword case-insensitively', () => {
    // @ts-expect-error: testing an untyped caller's casing
    expect(normalizeStyle('Italic')).toBe('italic');
    expect(normalizeStyle('normal')).toBe('normal');
  });
});

describe('assertValidFontFamilyDefinitions', () => {
  it('rejects an array element that is not an object with fontFamily and fontDefinitions', () => {
    expect(() => assertValidFontFamilyDefinitions([null])).toThrow(
      expect.objectContaining({ code: 'ERR_FONT_API' })
    );
    expect(() => assertValidFontFamilyDefinitions([42])).toThrow(
      expect.objectContaining({ code: 'ERR_FONT_API' })
    );
    expect(() => assertValidFontFamilyDefinitions([{ fontFamily: 'A' }])).toThrow(
      expect.objectContaining({ code: 'ERR_FONT_API' })
    );
  });

  it('rejects two entries that declare the same fontFamily', () => {
    expect(() =>
      assertValidFontFamilyDefinitions([
        { fontFamily: 'Dup', fontDefinitions: [{ path: 'a.ttf' }] },
        { fontFamily: 'Dup', fontDefinitions: [{ path: 'b.ttf' }] },
      ])
    ).toThrow(/Dup/);
  });

  it('accepts distinct, well-shaped entries', () => {
    expect(() =>
      assertValidFontFamilyDefinitions([
        { fontFamily: 'A', fontDefinitions: [{ path: 'a.ttf' }] },
        { fontFamily: 'B', fontDefinitions: [{ path: 'b.ttf' }] },
      ])
    ).not.toThrow();
  });
});

describe('resolveFaceWeight / resolveFaceStyle', () => {
  it('prefers the face-level weight/style over the path FontResource', () => {
    expect(resolveFaceWeight({ path: { uri: 'a.ttf', weight: 300 }, weight: 500 })).toBe(500);
    expect(resolveFaceStyle({ path: { uri: 'a.ttf', style: 'italic' }, style: 'normal' })).toBe(
      'normal'
    );
  });

  it('falls back to the FontResource path weight/style when the face leaves them unset', () => {
    expect(resolveFaceWeight({ path: { uri: 'a.ttf', weight: 300 } })).toBe(300);
    expect(resolveFaceStyle({ path: { uri: 'a.ttf', style: 'italic' } })).toBe('italic');
  });

  it('returns undefined for a string or number path', () => {
    expect(resolveFaceWeight({ path: 'a.ttf' })).toBeUndefined();
    expect(resolveFaceWeight({ path: 10 })).toBeUndefined();
  });
});
