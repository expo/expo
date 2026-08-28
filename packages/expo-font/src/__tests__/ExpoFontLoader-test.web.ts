import ExpoFontLoader, {
  _createWebFontTemplate,
  _fontFaceRuleSrcMatches,
  _matchesFontFaceOptions,
} from '../ExpoFontLoader.web';
import { FontDisplay } from '../Font.types';

const STYLE_ID = 'expo-generated-fonts';

// jsdom doesn't implement `CSSFontFaceRule`, and its CSSOM leaves `style.fontFamily`
// undefined on the `@font-face` rules it does parse. What's under test is how *browser*
// engines serialize `font-family`, so the rules are faked with the exact strings each
// engine returns — verified with Playwright in https://github.com/expo/expo/issues/49092.
class FakeCSSFontFaceRule {
  style: { fontFamily: string; fontDisplay: string };

  constructor(serializedFontFamily: string, fontDisplay: string = 'auto') {
    this.style = { fontFamily: serializedFontFamily, fontDisplay };
  }
}

type FakeSheet = { cssRules: FakeCSSFontFaceRule[]; deleteRule(index: number): void };

function installFontFaceRules(serializedFontFamilies: string[]): FakeSheet {
  const cssRules = serializedFontFamilies.map((family) => new FakeCSSFontFaceRule(family));
  const sheet: FakeSheet = {
    cssRules,
    deleteRule(index: number) {
      cssRules.splice(index, 1);
    },
  };

  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  Object.defineProperty(styleElement, 'sheet', { value: sheet, configurable: true });
  document.head.appendChild(styleElement);

  return sheet;
}

// This file also runs under the Node project, which has no DOM to install rules into.
if (typeof window === 'undefined') {
  it(`noop`, async () => {});
} else {
  beforeAll(() => {
    (globalThis as any).CSSFontFaceRule = FakeCSSFontFaceRule;
  });

  afterAll(() => {
    delete (globalThis as any).CSSFontFaceRule;
  });

  afterEach(() => {
    document.getElementById(STYLE_ID)?.remove();
  });

  describe('isLoaded', () => {
    it(`matches a family name the engine serializes without quotes`, () => {
      installFontFaceRules(['FlamaUltracondensed-Basic']);

      expect(ExpoFontLoader.isLoaded('FlamaUltracondensed-Basic')).toBe(true);
    });

    it(`matches a family name the engine serializes with quotes`, () => {
      installFontFaceRules(['"FlamaUltracondensed-Basic"']);

      expect(ExpoFontLoader.isLoaded('FlamaUltracondensed-Basic')).toBe(true);
    });

    it(`matches a family name that needs quoting, which every engine keeps quoted`, () => {
      installFontFaceRules(['"DIN 2014"']);

      expect(ExpoFontLoader.isLoaded('DIN 2014')).toBe(true);
    });

    it(`matches a family name serialized with single quotes`, () => {
      installFontFaceRules([`'DIN 2014'`]);

      expect(ExpoFontLoader.isLoaded('DIN 2014')).toBe(true);
    });

    it(`doesn't match a family that isn't registered`, () => {
      installFontFaceRules(['"DIN 2014"']);

      expect(ExpoFontLoader.isLoaded('DIN 2015')).toBe(false);
    });

    it(`matches a family whose name itself contains quotes`, () => {
      installFontFaceRules(['"\\"Weird\\""']);

      expect(ExpoFontLoader.isLoaded('"Weird"')).toBe(true);
    });

    it(`matches a family name with significant surrounding whitespace`, () => {
      installFontFaceRules(['"  Padded  "']);

      expect(ExpoFontLoader.isLoaded('  Padded  ')).toBe(true);
    });

    it(`does not conflate a padded name with its trimmed form`, () => {
      installFontFaceRules(['"  Padded  "']);

      expect(ExpoFontLoader.isLoaded('Padded')).toBe(false);
    });

    it(`does not treat quotes in the caller's name as CSS quoting`, () => {
      installFontFaceRules(['"MyFont"']);

      expect(ExpoFontLoader.isLoaded('"MyFont"')).toBe(false);
    });
  });

  describe('getLoadedFonts', () => {
    it(`returns the names fonts were loaded with, not the CSSOM serialization`, () => {
      installFontFaceRules(['FlamaUltracondensed-Basic', '"DIN 2014"', `'Single Quoted'`]);

      expect(ExpoFontLoader.getLoadedFonts()).toEqual([
        'FlamaUltracondensed-Basic',
        'DIN 2014',
        'Single Quoted',
      ]);
    });
  });

  describe('unloadAsync', () => {
    it(`removes a rule whose family name the engine serialized with quotes`, async () => {
      const sheet = installFontFaceRules(['"DIN 2014"']);

      await ExpoFontLoader.unloadAsync('DIN 2014');

      expect(sheet.cssRules).toHaveLength(0);
    });

    it(`removes every matching rule when more than one matches`, async () => {
      const sheet = installFontFaceRules(['"DIN 2014"', '"DIN 2014"', '"Other"']);

      await ExpoFontLoader.unloadAsync('DIN 2014');

      expect(sheet.cssRules).toHaveLength(1);
      expect(sheet.cssRules[0]?.style.fontFamily).toBe('"Other"');
    });
  });
}

function rule(style: Partial<CSSStyleDeclaration>): { style: CSSStyleDeclaration } {
  return { style: { fontFamily: '', fontWeight: '', fontStyle: '', ...style } as any };
}

describe('_createWebFontTemplate', () => {
  it('creates a minimal rule with only a family and uri when nothing else is specified', () => {
    expect(_createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2' })).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2")}'
    );
  });

  it('does not default font-display/font-weight/font-style, so a variable font file is not restricted to a single weight or style', () => {
    expect(_createWebFontTemplate('Wix Madefor Text Variable', { uri: 'variable.woff2' })).toBe(
      '@font-face{font-family:"Wix Madefor Text Variable";src:url("variable.woff2")}'
    );
  });

  it('includes font-display when specified', () => {
    expect(
      _createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', display: FontDisplay.SWAP })
    ).toBe('@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-display:swap}');
  });

  it.each<[Parameters<typeof _createWebFontTemplate>[1]['weight'], string]>([
    [700, '700'],
    ['700', '700'],
    ['normal', 'normal'],
    ['bold', 'bold'],
    [1, '1'],
    [1000, '1000'],
    ['100 900', '100 900'],
  ])('includes font-weight %p', (weight, expected) => {
    expect(_createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', weight })).toBe(
      `@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-weight:${expected}}`
    );
  });

  it('includes font-style when a style is provided', () => {
    expect(_createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', style: 'italic' })).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-style:italic}'
    );
  });

  it('includes font-display, font-weight, and font-style together when all are provided', () => {
    expect(
      _createWebFontTemplate('Wix Madefor Text', {
        uri: 'font.woff2',
        weight: 400,
        style: 'italic',
        display: FontDisplay.SWAP,
      })
    ).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-display:swap;font-weight:400;font-style:italic}'
    );
  });

  it('omits font-weight/font-style that fail CSS identifier sanitization', () => {
    expect(
      _createWebFontTemplate('Wix Madefor Text', {
        uri: 'font.woff2',
        weight: '400}; body{display:none} @font-face{font-family:"x',
        // @ts-expect-error: testing sanitization of untrusted input
        style: 'italic}//',
      })
    ).toBe('@font-face{font-family:"Wix Madefor Text";src:url("font.woff2")}');
  });
});

describe('_matchesFontFaceOptions', () => {
  const regular = rule({ fontFamily: 'Wix Madefor Text', fontWeight: '400', fontStyle: '' });
  const italic = rule({ fontFamily: 'Wix Madefor Text', fontWeight: '400', fontStyle: 'italic' });
  const bold = rule({ fontFamily: 'Wix Madefor Text', fontWeight: '800', fontStyle: '' });
  const otherFamily = rule({ fontFamily: 'Other Family', fontWeight: '400', fontStyle: '' });

  it('matches by family name alone when no options are given', () => {
    expect(_matchesFontFaceOptions(regular, 'Wix Madefor Text')).toBe(true);
    expect(_matchesFontFaceOptions(italic, 'Wix Madefor Text')).toBe(true);
    expect(_matchesFontFaceOptions(otherFamily, 'Wix Madefor Text')).toBe(false);
  });

  it('distinguishes faces of the same family by weight', () => {
    expect(_matchesFontFaceOptions(regular, 'Wix Madefor Text', { weight: 400 })).toBe(true);
    expect(_matchesFontFaceOptions(bold, 'Wix Madefor Text', { weight: 400 })).toBe(false);
    expect(_matchesFontFaceOptions(bold, 'Wix Madefor Text', { weight: 800 })).toBe(true);
  });

  it('distinguishes faces of the same family by style', () => {
    expect(_matchesFontFaceOptions(regular, 'Wix Madefor Text', { style: 'italic' })).toBe(false);
    expect(_matchesFontFaceOptions(italic, 'Wix Madefor Text', { style: 'italic' })).toBe(true);
  });

  it('requires weight and style to both match when both are given', () => {
    expect(
      _matchesFontFaceOptions(italic, 'Wix Madefor Text', { weight: 400, style: 'italic' })
    ).toBe(true);
    expect(
      _matchesFontFaceOptions(bold, 'Wix Madefor Text', { weight: 400, style: 'italic' })
    ).toBe(false);
  });

  it.each<[string, number | string, boolean]>([
    ['normal', 400, true],
    ['400', 'normal', true],
    ['bold', 700, true],
    ['700', 'bold', true],
    ['400', 'bold', false],
    ['800', 400, false],
  ])(
    'weight normalization: rule weight %p vs option %p matches: %p',
    (ruleWeight, matchWeight, expected) => {
      const testRule = rule({
        fontFamily: 'Wix Madefor Text',
        fontWeight: ruleWeight,
        fontStyle: '',
      });
      expect(_matchesFontFaceOptions(testRule, 'Wix Madefor Text', { weight: matchWeight })).toBe(
        expected
      );
    }
  );
});

describe('_fontFaceRuleSrcMatches', () => {
  function ruleWithSrc(src: string): { style: CSSStyleDeclaration } {
    return {
      style: {
        getPropertyValue: (property: string) => (property === 'src' ? src : ''),
      } as any,
    };
  }

  it('matches when the rule references the same uri', () => {
    expect(_fontFaceRuleSrcMatches(ruleWithSrc('url("bold.ttf")'), 'bold.ttf')).toBe(true);
  });

  it('does not match when the rule references a different uri', () => {
    expect(_fontFaceRuleSrcMatches(ruleWithSrc('url("bold.ttf")'), 'regular.ttf')).toBe(false);
  });

  it('falls back to matching when the engine does not expose the src descriptor', () => {
    expect(_fontFaceRuleSrcMatches(ruleWithSrc(''), 'regular.ttf')).toBe(true);
  });

  it('matches single-quoted and unquoted url() forms', () => {
    expect(_fontFaceRuleSrcMatches(ruleWithSrc("url('bold.ttf')"), 'bold.ttf')).toBe(true);
    expect(_fontFaceRuleSrcMatches(ruleWithSrc('url(bold.ttf)'), 'bold.ttf')).toBe(true);
  });

  it('decodes a percent-encoded uri before comparing', () => {
    expect(
      _fontFaceRuleSrcMatches(ruleWithSrc('url("bold%20italic.ttf")'), 'bold italic.ttf')
    ).toBe(true);
  });
});
