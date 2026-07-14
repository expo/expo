import {
  convertBcp47ToResourceQualifier,
  setResourceConfigurations,
} from '../src/withExpoLocalization';

describe('converts locales to BCP-47 format', () => {
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

describe('setResourceConfigurations', () => {
  const buildGradle = `android {
    defaultConfig {
        applicationId "com.example.app"
    }
}`;

  const countResourceConfigurations = (contents: string) =>
    contents.match(/resourceConfigurations/g)?.length ?? 0;

  it('adds the resourceConfigurations entry inside defaultConfig on first run', () => {
    const result = setResourceConfigurations(buildGradle, ['b+ko']);

    expect(result).toContain('resourceConfigurations += ["b+ko"]');
    expect(countResourceConfigurations(result)).toBe(1);
  });

  it('formats multiple qualifiers as a single entry', () => {
    const result = setResourceConfigurations(buildGradle, ['b+ko', 'b+en+US', 'b+ja']);

    expect(result).toContain('resourceConfigurations += ["b+ko", "b+en+US", "b+ja"]');
    expect(countResourceConfigurations(result)).toBe(1);
  });

  it('is idempotent across repeated runs with the same locales', () => {
    const firstRun = setResourceConfigurations(buildGradle, ['b+ko']);
    const secondRun = setResourceConfigurations(firstRun, ['b+ko']);

    expect(secondRun).toBe(firstRun);
    expect(countResourceConfigurations(secondRun)).toBe(1);
  });

  it('replaces the existing entry when the locales change instead of leaving both', () => {
    const firstRun = setResourceConfigurations(buildGradle, ['b+ko']);
    const secondRun = setResourceConfigurations(firstRun, ['b+ko', 'b+ja']);

    expect(secondRun).toContain('resourceConfigurations += ["b+ko", "b+ja"]');
    expect(secondRun).not.toContain('resourceConfigurations += ["b+ko"]');
    expect(countResourceConfigurations(secondRun)).toBe(1);
  });
});
