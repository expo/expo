import { AndroidConfig } from 'expo/config-plugins';

import { convertBcp47ToResourceQualifier } from '../build/withExpoLocalization';

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

describe('resourceConfigurations deduplication', () => {
  const buildGradleBase = `android {
    defaultConfig {
        applicationId "com.example.app"
    }
}`;

  function applyResourceConfigurations(contents: string, locales: string[]): string {
    const resourceQualifiers = locales.map((locale) => convertBcp47ToResourceQualifier(locale));
    const resourceConfigEntry = `resourceConfigurations += [${resourceQualifiers.map((qualifier) => `"${qualifier}"`).join(', ')}]`;
    if (!contents.includes(resourceConfigEntry)) {
      contents = AndroidConfig.CodeMod.appendContentsInsideDeclarationBlock(
        contents,
        'defaultConfig',
        `    ${resourceConfigEntry}\n    `
      );
    }
    return contents;
  }

  it('should add resourceConfigurations on first run', () => {
    const result = applyResourceConfigurations(buildGradleBase, ['ko']);
    expect(result).toContain('resourceConfigurations += ["b+ko"]');
  });

  it('should not duplicate resourceConfigurations on repeated runs', () => {
    const firstRun = applyResourceConfigurations(buildGradleBase, ['ko']);
    const secondRun = applyResourceConfigurations(firstRun, ['ko']);

    expect(secondRun).toBe(firstRun);
    expect(secondRun.match(/resourceConfigurations/g)?.length).toBe(1);
  });

  it('should handle multiple locales without duplication', () => {
    const firstRun = applyResourceConfigurations(buildGradleBase, ['ko', 'en-US', 'ja']);
    const secondRun = applyResourceConfigurations(firstRun, ['ko', 'en-US', 'ja']);

    expect(secondRun).toBe(firstRun);
    expect(secondRun).toContain('resourceConfigurations += ["b+ko", "b+en+US", "b+ja"]');
    expect(secondRun.match(/resourceConfigurations/g)?.length).toBe(1);
  });
});
