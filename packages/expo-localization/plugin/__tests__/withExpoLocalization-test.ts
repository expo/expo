import { convertLocaleToBcp47 } from '../src/withExpoLocalization';

describe('converts locales to BCP-47 format', () => {
  it('should convert "-r" cases to BCP-47 format', () => {
    expect(convertLocaleToBcp47('en-rUS')).toBe('en-rUS');
    expect(convertLocaleToBcp47('fr-rFR')).toBe('fr-rFR');
  });

  it('should convert simple language codes to BCP-47 format', () => {
    expect(convertLocaleToBcp47('en')).toBe('b+en');
    expect(convertLocaleToBcp47('fr')).toBe('b+fr');
    expect(convertLocaleToBcp47('de')).toBe('b+de');
    expect(convertLocaleToBcp47('es')).toBe('b+es');
    expect(convertLocaleToBcp47('ja')).toBe('b+ja');
    expect(convertLocaleToBcp47('zh')).toBe('b+zh');
  });

  it('should convert language-region codes to BCP-47 format', () => {
    expect(convertLocaleToBcp47('en-US')).toBe('b+en+US');
    expect(convertLocaleToBcp47('en-GB')).toBe('b+en+GB');
    expect(convertLocaleToBcp47('zh-Hans')).toBe('b+zh+Hans');
    expect(convertLocaleToBcp47('zh-Hant')).toBe('b+zh+Hant');
    expect(convertLocaleToBcp47('es-419')).toBe('b+es+419');
    expect(convertLocaleToBcp47('zh-Hant-TW')).toBe('b+zh+Hant+TW');
  });
});
