import { applyNameSettingsGradle, sanitizeNameForGradle } from '../Name';

const mockSettingsGradle = `rootProject.name = 'My-Co0l 😃 Pet_Project!'

apply from: '../node_modules/react-native-unimodules/gradle.groovy'
includeUnimodulesProjects()

apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle");
applyNativeModulesSettingsGradle(settings)

include ':app'
`;

const badName = `😃/\\:<>"?*|$F0g.`;
const badNameCleaned = `😃$F0g.`;

describe(sanitizeNameForGradle, () => {
  it('removes invalid characters', () => {
    expect(sanitizeNameForGradle(badName)).toBe(badNameCleaned);
  });
});
describe(applyNameSettingsGradle, () => {
  it('replaces name in settings', () => {
    const modified = applyNameSettingsGradle({ name: badName }, mockSettingsGradle);
    expect(modified.includes(`rootProject.name = '${badNameCleaned}'\n`)).toBe(true);
  });
  it('replaces name in settings with odd linting', () => {
    // No spaces and double quotes are supported too right now.
    const modified = applyNameSettingsGradle(
      { name: badName },
      `rootProject.name="My-Co0l 😃 Pet_Project!"`
    );
    // Replaces with expected linting
    expect(modified).toBe(`rootProject.name = '${badNameCleaned}'`);
  });
  it('escapes single quotes in name', () => {
    const modified = applyNameSettingsGradle({ name: "Nora's" }, `rootProject.name="Replace me"`);
    expect(modified).toBe(`rootProject.name = 'Nora\\'s'`);
  });
});
