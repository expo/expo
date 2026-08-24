import ExpoFontLoader from '../ExpoFontLoader.web';

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
