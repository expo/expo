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
