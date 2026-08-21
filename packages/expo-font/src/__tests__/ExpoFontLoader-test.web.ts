import {
  _createWebFontTemplate,
  _fontFamilyMatchesRule,
  _normalizeFontFamilyName,
} from '../ExpoFontLoader.web';

// The family name this module writes into a `@font-face` rule and the family name it later reads
// back off `CSSFontFaceRule.style.fontFamily` are not the same string. CSSOM serialization of
// `font-family` is a gray area where engines disagree about quoting:
//
// - Firefox preserves the quotes from the declaration, so every rule this module writes reads back
//   quoted, for any family name.
// - Chromium and WebKit strip the quotes for identifier-safe names but keep them for names that
//   need quoting, such as anything containing a space.
//
// Normalizing both sides before comparing is what keeps `isLoaded`, `unloadAsync` and
// `getLoadedFonts` working across engines.
describe('_normalizeFontFamilyName', () => {
  it('strips the double quotes Firefox preserves for every rule', () => {
    expect(_normalizeFontFamilyName('"MyFont"')).toBe('MyFont');
  });

  it('leaves an unquoted name as Chromium and WebKit serialize it', () => {
    expect(_normalizeFontFamilyName('MyFont')).toBe('MyFont');
  });

  it('strips the quotes every engine keeps for a name containing a space', () => {
    expect(_normalizeFontFamilyName('"DIN 2014"')).toBe('DIN 2014');
  });

  it('strips single quotes', () => {
    expect(_normalizeFontFamilyName("'MyFont'")).toBe('MyFont');
  });

  it('unescapes a quote inside a quoted name', () => {
    expect(_normalizeFontFamilyName('"My\\"Font"')).toBe('My"Font');
  });

  it('ignores surrounding whitespace', () => {
    expect(_normalizeFontFamilyName('  "MyFont"  ')).toBe('MyFont');
  });

  it('leaves a bare name whose quotes are unbalanced alone', () => {
    expect(_normalizeFontFamilyName('"MyFont')).toBe('"MyFont');
  });
});

// The invariant that was broken: a family name written by this module must normalize back to the
// name it was written with, whichever way the engine chose to serialize it.
describe('round trip with _createWebFontTemplate', () => {
  it.each(['MyFont', 'DIN 2014', "Ada's Font"])('round trips %p', (fontFamily) => {
    const css = _createWebFontTemplate(fontFamily, { uri: 'font.ttf' });
    const declared = css.match(/font-family:([^;]+);/)?.[1];

    expect(declared).toBeDefined();
    // As Firefox serializes it: the declaration is preserved verbatim.
    expect(_normalizeFontFamilyName(declared!)).toBe(fontFamily);
  });
});

// A rule's `font-family` is a CSS component value that an engine may quote and escape; the name a
// caller loads a font under is a literal string. Only the rule's side may be normalized — a family
// name is allowed to contain the very quotes and whitespace normalization strips.
describe('_fontFamilyMatchesRule', () => {
  const declaredValue = (fontFamily: string) => {
    const css = _createWebFontTemplate(fontFamily, { uri: 'font.ttf', display: 'auto' } as any);
    const declared = css.match(/font-family:([^;]+);/)?.[1];
    expect(declared).toBeDefined();
    return declared!;
  };

  it.each([
    ['an identifier-safe name', 'MyFont'],
    ['a name containing a space', 'DIN 2014'],
    ['a name that is itself wrapped in quotes', '"Weird"'],
    ['a name with significant surrounding whitespace', '  Padded  '],
    ['a name containing a quote', 'He said "hi"'],
  ])('matches the rule this module writes for %s', (_label, fontFamily) => {
    expect(_fontFamilyMatchesRule(declaredValue(fontFamily), fontFamily)).toBe(true);
  });

  it('matches an unquoted serialization', () => {
    expect(_fontFamilyMatchesRule('MyFont', 'MyFont')).toBe(true);
  });

  it('does not match a different family', () => {
    expect(_fontFamilyMatchesRule('"MyFont"', 'OtherFont')).toBe(false);
  });

  it('does not conflate two families that differ only by surrounding whitespace', () => {
    expect(_fontFamilyMatchesRule(declaredValue('  Padded  '), 'Padded')).toBe(false);
  });
});
