import { convertBcp47ToResourceQualifier } from '../src/withExpoLocalization';

describe('converts locales to BCP-47 format', () => {
  it('should convert "-r" cases to BCP-47 format', () => {
    expect(convertBcp47ToResourceQualifier('en-rUS')).toBe('en-rUS');
    expect(convertBcp47ToResourceQualifier('fr-rFR')).toBe('fr-rFR');
  });

  it('should convert simple language codes to BCP-47 format', () => {
    expect(convertBcp47ToResourceQualifier('en')).toBe('b+en');
    expect(convertBcp47ToResourceQualifier('fr')).toBe('b+fr');
    expect(convertBcp47ToResourceQualifier('de')).toBe('b+de');
    expect(convertBcp47ToResourceQualifier('es')).toBe('b+es');
    expect(convertBcp47ToResourceQualifier('ja')).toBe('b+ja');
    expect(convertBcp47ToResourceQualifier('zh')).toBe('b+zh');
  });

  it('should convert language-region codes to BCP-47 format', () => {
    expect(convertBcp47ToResourceQualifier('en-US')).toBe('b+en+US');
    expect(convertBcp47ToResourceQualifier('en-GB')).toBe('b+en+GB');
    expect(convertBcp47ToResourceQualifier('zh-Hans')).toBe('b+zh+Hans');
    expect(convertBcp47ToResourceQualifier('zh-Hant')).toBe('b+zh+Hant');
    expect(convertBcp47ToResourceQualifier('es-419')).toBe('b+es+419');
    expect(convertBcp47ToResourceQualifier('zh-Hant-TW')).toBe('b+zh+Hant+TW');
  });
});
