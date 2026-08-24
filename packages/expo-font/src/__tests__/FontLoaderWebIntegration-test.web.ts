import ExpoFontLoader from '../ExpoFontLoader';
import * as Font from '../Font';
import * as FontLoader from '../FontLoader';

// Exercises the real, unmocked `ExpoFontLoader.web` pipeline end to end; only `fontfaceobserver` is mocked.
jest.mock('fontfaceobserver', () =>
  jest.fn().mockImplementation(() => ({
    load: jest.fn(() => Promise.resolve()),
  }))
);

const STYLE_ID = 'expo-generated-fonts';

function injectedCss(): string {
  return document.getElementById(STYLE_ID)?.textContent ?? '';
}

if (typeof window === 'undefined') {
  it('noop', async () => {});
} else {
  // jsdom never exposes the `CSSFontFaceRule` global, and its `@font-face` style object lacks
  // camelCase accessors (`fontFamily`, `fontWeight`, ...), only raw kebab-case properties. This
  // shim adds both, so the production matching code can run against jsdom.
  beforeAll(() => {
    const probe = document.createElement('style');
    document.head.appendChild(probe);
    probe.appendChild(document.createTextNode('@font-face{font-family:"__probe__";src:url("p")}'));
    const rule: any = [...((probe.sheet as any)?.cssRules ?? [])][0];
    if (rule) {
      if (typeof (globalThis as any).CSSFontFaceRule === 'undefined') {
        (globalThis as any).CSSFontFaceRule = rule.constructor;
      }
      const proto = Object.getPrototypeOf(rule.style);
      for (const [camel, kebab] of [
        ['fontFamily', 'font-family'],
        ['fontWeight', 'font-weight'],
        ['fontStyle', 'font-style'],
        ['fontDisplay', 'font-display'],
      ] as const) {
        if (!(camel in proto)) {
          Object.defineProperty(proto, camel, {
            configurable: true,
            get(this: CSSStyleDeclaration) {
              return this.getPropertyValue(kebab);
            },
          });
        }
      }
    }
    document.head.removeChild(probe);
  });

  afterEach(() => {
    document.getElementById(STYLE_ID)?.remove();
  });

  it('injects one @font-face rule per face, with correct descriptors, for a multi-face family', async () => {
    await Font.loadAsync([
      {
        fontFamily: 'Real Family',
        fontDefinitions: [
          { path: 'regular.ttf', weight: 400 },
          { path: 'bold.ttf', weight: 700 },
          { path: 'italic.ttf', weight: 400, style: 'italic' },
        ],
      },
    ]);

    const css = injectedCss();
    expect(css).toContain(
      '@font-face{font-family:"Real Family";src:url("regular.ttf");font-weight:400}'
    );
    expect(css).toContain(
      '@font-face{font-family:"Real Family";src:url("bold.ttf");font-weight:700}'
    );
    expect(css).toContain(
      '@font-face{font-family:"Real Family";src:url("italic.ttf");font-weight:400;font-style:italic}'
    );
    expect(css.match(/@font-face/g)).toHaveLength(3);
  });

  it('does not inject a duplicate rule when the same face loads twice', async () => {
    await FontLoader.loadFontFamilyAsync('Dup Family', [{ path: 'dup.ttf', weight: 400 }]);
    await FontLoader.loadFontFamilyAsync('Dup Family', [{ path: 'dup.ttf', weight: 'normal' }]);

    const css = injectedCss();
    expect(css.match(/dup\.ttf/g)).toHaveLength(1);
  });

  it('still injects a separate rule for a different family with the same descriptors', async () => {
    const fontDefinitions = [{ path: 'shared.ttf', weight: 400 }];

    await FontLoader.loadFontFamilyAsync('FamilyA', fontDefinitions);
    await FontLoader.loadFontFamilyAsync('FamilyB', fontDefinitions);

    const css = injectedCss();
    expect(css.match(/shared\.ttf/g)).toHaveLength(2);
  });

  it('dedupes faces and reports isLoaded for a family name containing a space', async () => {
    const fontDefinitions = [
      { path: 'regular.ttf', weight: 400 },
      { path: 'bold.ttf', weight: 700 },
    ];

    await FontLoader.loadFontFamilyAsync('Wix Madefor Text', fontDefinitions);
    await FontLoader.loadFontFamilyAsync('Wix Madefor Text', fontDefinitions);

    const css = injectedCss();
    expect(css.match(/@font-face/g)).toHaveLength(2);
    expect(ExpoFontLoader.isLoaded!('Wix Madefor Text')).toBe(true);
  });

  it('returns each family once, unquoted, from getLoadedFonts for a multi-face family with a space in its name', async () => {
    await FontLoader.loadFontFamilyAsync('Wix Madefor Text', [
      { path: 'regular.ttf', weight: 400 },
      { path: 'bold.ttf', weight: 700 },
      { path: 'italic.ttf', weight: 400, style: 'italic' },
    ]);

    expect(ExpoFontLoader.getLoadedFonts()).toEqual(['Wix Madefor Text']);
  });
}
