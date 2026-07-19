import { _createWebFontTemplate, _matchesFontFaceOptions } from '../ExpoFontLoader.web';
import { FontDisplay } from '../Font.types';

function rule(style: Partial<CSSStyleDeclaration>): { style: CSSStyleDeclaration } {
  return { style: { fontFamily: '', fontWeight: '', fontStyle: '', ...style } as any };
}

describe('_createWebFontTemplate', () => {
  it('creates a basic rule with only a uri and display', () => {
    expect(_createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2' })).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-display:auto}'
    );
  });

  it('includes font-weight when a numeric weight is provided', () => {
    expect(_createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', weight: 700 })).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-display:auto;font-weight:700}'
    );
  });

  it('includes font-style when a style is provided', () => {
    expect(
      _createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', style: 'italic' })
    ).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-display:auto;font-style:italic}'
    );
  });

  it('includes both font-weight and font-style when provided together', () => {
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
    ).toBe(
      '@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-display:auto}'
    );
  });

  it('reproduces the reported multi-face family output, one rule per face', () => {
    // A "Wix Madefor Text" family with a regular, an italic, and a bold face, each defaulting
    // weight/style to 400/"normal" when unset.
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
