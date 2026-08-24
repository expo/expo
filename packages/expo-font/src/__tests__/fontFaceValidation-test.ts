import {
  assertValidFontFaces,
  assertValidFontFamilyDefinitions,
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

  it('rejects a non-integer weight', () => {
    expect(() => assertValidFontFaces('Family', [{ path: 'a.ttf', weight: 400.5 }])).toThrow(
      'Invalid font weight'
    );
  });

  it('accepts a valid single-face definition', () => {
    expect(() => assertValidFontFaces('Family', [{ path: 'a.ttf', weight: 400 }])).not.toThrow();
  });
});

describe('normalizeWeight', () => {
  it('rejects a non-integer weight and says so in the message', () => {
    expect(() => normalizeWeight(400.5)).toThrow(/whole number/);
  });

  it('still accepts a valid integer weight', () => {
    expect(normalizeWeight(400)).toBe(400);
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
