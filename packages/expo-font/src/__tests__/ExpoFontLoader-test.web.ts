import { _createWebFontTemplate, _matchesFontFaceOptions } from '../ExpoFontLoader.web';
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
    expect(
      _createWebFontTemplate('Wix Madefor Text Variable', { uri: 'variable.woff2' })
    ).toBe('@font-face{font-family:"Wix Madefor Text Variable";src:url("variable.woff2")}');
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

  it('includes font-style when a style is provided', () => {
    expect(
      _createWebFontTemplate('Wix Madefor Text', { uri: 'font.woff2', style: 'italic' })
    ).toBe('@font-face{font-family:"Wix Madefor Text";src:url("font.woff2");font-style:italic}');
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
