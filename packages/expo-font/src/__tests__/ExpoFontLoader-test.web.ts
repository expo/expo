import ExpoFontLoader, {
  _createWebFontTemplate,
  _fontFaceRuleSrcMatches,
  _matchesFontFaceOptions,
} from '../ExpoFontLoader.web';
import { FontDisplay } from '../Font.types';

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
    // A variable font file covers a range of weights/styles; forcing e.g. `font-weight: 400`
    // on it would incorrectly restrict the face to only that one weight.
    expect(_createWebFontTemplate('Wix Madefor Text Variable', { uri: 'variable.woff2' })).toBe(
      '@font-face{font-family:"Wix Madefor Text Variable";src:url("variable.woff2")}'
    );
  });

  it('includes font-display when specified', () => {
    expect(
      _createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', display: FontDisplay.SWAP })
    ).toBe('@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-display:swap}');
  });

  it('includes font-weight when a numeric weight is provided', () => {
    expect(_createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', weight: 700 })).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-weight:700}'
    );
  });

  it('includes font-weight when a numeric-string weight is provided', () => {
    expect(_createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', weight: '700' })).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-weight:700}'
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
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(
        _createWebFontTemplate('Wix Madefor Text', {
          uri: 'font.woff2',
          weight: '400}; body{display:none} @font-face{font-family:"x',
          // @ts-expect-error: testing sanitization of untrusted input
          style: 'italic}//',
        })
      ).toBe('@font-face{font-family:"Wix Madefor Text";src:url("font.woff2")}');
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('reproduces the reported multi-face family output, one rule per face', () => {
    // A "Wix Madefor Text" family with a regular, an italic, and a bold face, each explicitly
    // specifying weight/style since these are separate static files, not a variable font.
    const regular = _createWebFontTemplate('Wix Madefor Text', {
      uri: 'fonts/WixMadeforText-Regular.woff2',
      display: FontDisplay.AUTO,
      weight: 400,
      style: 'normal',
    });
    const italic = _createWebFontTemplate('Wix Madefor Text', {
      uri: 'fonts/WixMadeforText-Italic.woff2',
      display: FontDisplay.AUTO,
      weight: 400,
      style: 'italic',
    });
    const bold = _createWebFontTemplate('Wix Madefor Text', {
      uri: 'fonts/WixMadeforText-Bold.woff2',
      display: FontDisplay.AUTO,
      weight: 800,
      style: 'normal',
    });

    expect(regular).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("fonts/WixMadeforText-Regular.woff2");font-display:auto;font-weight:400;font-style:normal}'
    );
    expect(italic).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("fonts/WixMadeforText-Italic.woff2");font-display:auto;font-weight:400;font-style:italic}'
    );
    expect(bold).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("fonts/WixMadeforText-Bold.woff2");font-display:auto;font-weight:800;font-style:normal}'
    );
    // Same family, three distinct rules — the browser can select the right face via
    // font-weight/font-style instead of needing three unrelated fontFamily names.
    expect(new Set([regular, italic, bold]).size).toBe(3);
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
  });
}
