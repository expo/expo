import { applyBetaTag, getResolvedTemplateName, splitNpmNameAndTag } from '../npm';

describe(applyBetaTag, () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should apply the beta tag', () => {
    process.env.EXPO_BETA = 'true';
    expect(applyBetaTag('expo-template-blank')).toBe('expo-template-blank@beta');
  });
  it('should not overwrite an existing tag', () => {
    process.env.EXPO_BETA = 'true';
    expect(applyBetaTag('expo-template-blank@45')).toBe('expo-template-blank@45');
  });
  it('should not apply the beta tag when EXPO_BETA is not enabled', () => {
    delete process.env.EXPO_BETA;
    expect(applyBetaTag('expo-template-blank')).toBe('expo-template-blank');
  });
});

describe(splitNpmNameAndTag, () => {
  it(`splits without tag`, () => {
    expect(splitNpmNameAndTag('expo-template-blank')).toEqual(['expo-template-blank', undefined]);
  });
  it(`splits with tag`, () => {
    expect(splitNpmNameAndTag('expo-template-blank@45.0')).toEqual(['expo-template-blank', '45.0']);
  });
  it(`splits an org without tag`, () => {
    expect(splitNpmNameAndTag('@expo/foobar')).toEqual(['@expo/foobar', undefined]);
  });
  it(`splits an org with tag`, () => {
    expect(splitNpmNameAndTag('@expo/foobar@45.0.0')).toEqual(['@expo/foobar', '45.0.0']);
  });
});

describe(getResolvedTemplateName, () => {
  it('should expand an alias', () => {
    expect(getResolvedTemplateName('@expo/foobar@2.1.0')).toBe('@expo/foobar@2.1.0');
    expect(getResolvedTemplateName('expo-template-blank')).toBe('expo-template-blank@latest');
    expect(getResolvedTemplateName('expo-template-blank@beta')).toBe('expo-template-blank@beta');
    expect(getResolvedTemplateName('blank')).toBe('expo-template-blank@latest');
    expect(getResolvedTemplateName('blank-typescript')).toBe(
      'expo-template-blank-typescript@latest'
    );
    expect(getResolvedTemplateName('tabs')).toBe('expo-template-tabs@latest');
    expect(getResolvedTemplateName('bare-minimum')).toBe('expo-template-bare-minimum@latest');
  });
  it('should expand numeric tag to sdk-X', () => {
    // expect(expandAlias('blank@sdk-45')).toBe('expo-template-blank@sdk-45');
    expect(getResolvedTemplateName('expo-template-blank@45')).toBe('expo-template-blank@sdk-45');
    // expect(expandAlias('expo-template-blank@45f')).toBe('expo-template-blank@45f');
  });
});
