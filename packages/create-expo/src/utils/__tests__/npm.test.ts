import {
  applyBetaTag,
  getResolvedTemplateName,
  parseNpmPackOutput,
  splitNpmNameAndTag,
} from '../npm';

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

describe(parseNpmPackOutput, () => {
  const packageInfo = {
    id: 'expo-template-default@57.0.9',
    name: 'expo-template-default',
    version: '57.0.9',
    size: 1408284,
    unpackedSize: 1444997,
    shasum: '8d13268805fc322ecb2fa588f32ff01264a30072',
    integrity: 'sha512-pGOTwdKNxGx8MJHYcoqt0/hwUZ3gXke+OkG5hkRzLU5q2LefX5u+kwsWBi7fA+13zd4FtM/2EPeID50VDecZ1Q==',
    filename: 'expo-template-default-57.0.9.tgz',
    files: [{ path: 'package.json', size: 100, mode: 420 }],
    entryCount: 1,
    bundled: [],
  };

  it('parses the array shape returned by npm < 12', () => {
    expect(parseNpmPackOutput(JSON.stringify([packageInfo]))).toEqual([packageInfo]);
  });

  it('parses the object-keyed-by-name shape returned by npm >= 12', () => {
    expect(parseNpmPackOutput(JSON.stringify({ [packageInfo.name]: packageInfo }))).toEqual([
      packageInfo,
    ]);
  });

  it('throws on an invalid response', () => {
    expect(() => parseNpmPackOutput(JSON.stringify({ foo: 'bar' }))).toThrow(
      /Invalid response from npm/
    );
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
