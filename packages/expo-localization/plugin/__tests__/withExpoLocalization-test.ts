import { convertBcp47ToAndroidLocale } from '../src/withExpoLocalization';

describe('convertBcp47ToAndroidLocale', () => {
  it('should keep simple language codes unchanged', () => {
    expect(convertBcp47ToAndroidLocale('en')).toBe('en');
    expect(convertBcp47ToAndroidLocale('fr')).toBe('fr');
    expect(convertBcp47ToAndroidLocale('de')).toBe('de');
    expect(convertBcp47ToAndroidLocale('es')).toBe('es');
    expect(convertBcp47ToAndroidLocale('ja')).toBe('ja');
    expect(convertBcp47ToAndroidLocale('zh')).toBe('zh');
  });

  it('should convert BCP-47 language-region codes to Android format', () => {
    expect(convertBcp47ToAndroidLocale('en-US')).toBe('en-rUS');
    expect(convertBcp47ToAndroidLocale('en-GB')).toBe('en-rGB');
    expect(convertBcp47ToAndroidLocale('nb-NO')).toBe('nb-rNO');
    expect(convertBcp47ToAndroidLocale('pt-BR')).toBe('pt-rBR');
    expect(convertBcp47ToAndroidLocale('pt-PT')).toBe('pt-rPT');
    expect(convertBcp47ToAndroidLocale('zh-CN')).toBe('zh-rCN');
    expect(convertBcp47ToAndroidLocale('zh-TW')).toBe('zh-rTW');
    expect(convertBcp47ToAndroidLocale('fr-CA')).toBe('fr-rCA');
    expect(convertBcp47ToAndroidLocale('es-MX')).toBe('es-rMX');
  });

  it('should handle locales with script codes by extracting region', () => {
    expect(convertBcp47ToAndroidLocale('zh-Hans-CN')).toBe('zh-rCN');
    expect(convertBcp47ToAndroidLocale('zh-Hant-TW')).toBe('zh-rTW');
    expect(convertBcp47ToAndroidLocale('zh-Hans-MO')).toBe('zh-rMO');
    expect(convertBcp47ToAndroidLocale('sr-Latn-RS')).toBe('sr-rRS');
    expect(convertBcp47ToAndroidLocale('sr-Cyrl-RS')).toBe('sr-rRS');
  });

  it('should handle underscore separators', () => {
    expect(convertBcp47ToAndroidLocale('en_US')).toBe('en-rUS');
    expect(convertBcp47ToAndroidLocale('fr_CA')).toBe('fr-rCA');
    expect(convertBcp47ToAndroidLocale('pt_BR')).toBe('pt-rBR');
  });

  it('should normalize language codes to lowercase and region codes to uppercase', () => {
    expect(convertBcp47ToAndroidLocale('EN-us')).toBe('en-rUS');
    expect(convertBcp47ToAndroidLocale('Fr-ca')).toBe('fr-rCA');
    expect(convertBcp47ToAndroidLocale('PT-br')).toBe('pt-rBR');
  });

  it('should return already formatted Android locales unchanged', () => {
    expect(convertBcp47ToAndroidLocale('en-rUS')).toBe('en-rUS');
    expect(convertBcp47ToAndroidLocale('pt-rBR')).toBe('pt-rBR');
    expect(convertBcp47ToAndroidLocale('zh-rCN')).toBe('zh-rCN');
  });

  it('should handle numeric region codes (UN M.49)', () => {
    expect(convertBcp47ToAndroidLocale('es-419')).toBe('es-r419');
  });

  it('should handle edge cases with only script codes (no region)', () => {
    // When there's only a script code and no region, should return just the language
    expect(convertBcp47ToAndroidLocale('zh-Hans')).toBe('zh');
    expect(convertBcp47ToAndroidLocale('sr-Latn')).toBe('sr');
  });
});
