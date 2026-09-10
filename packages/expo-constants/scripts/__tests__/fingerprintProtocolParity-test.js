const fs = require('node:fs');
const path = require('node:path');

const { FINGERPRINT_FILE_NAME } = require('../createFingerprintFile');

// `app.fingerprint` is a protocol: the writer and every reader declare the name locally,
// because they cannot share code across languages and packages. This test trips on a rename,
// which would otherwise break the other side with no failure near the change. One reader lives
// in expo/expo-agent-cli and pins the same literal in its own test.
describe('app.fingerprint protocol parity', () => {
  const packagesDir = path.join(__dirname, '..', '..', '..');

  it(`the writer declares app.fingerprint`, () => {
    expect(FINGERPRINT_FILE_NAME).toBe('app.fingerprint');
  });

  it.each([
    [
      'the Android reader (ConstantsService.kt)',
      'expo-constants/android/src/main/java/expo/modules/constants/ConstantsService.kt',
      '"app.fingerprint"',
    ],
    [
      'the iOS reader (ConstantsProvider.swift)',
      'expo-modules-core/ios/Utilities/ConstantsProvider.swift',
      'forResource: "app", withExtension: "fingerprint"',
    ],
  ])(`%s declares the same file name`, (_description, file, literal) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain(literal);
  });

  // Both sides must hash with identical options, and both declare them locally.
  // TODO: this pins the option names, not their equivalence. Exporting them from
  // `@expo/fingerprint` would prevent the drift instead of detecting it.
  it.each([
    ['the embed script', 'expo-constants/scripts/createFingerprintFile.js'],
    ['the dev server and the prebuild marker (@expo/cli)', '@expo/cli/src/utils/nativeFingerprint.ts'],
  ])(`%s uses the shared fingerprint options`, (_description, file) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain('platforms: [platform]');
    expect(contents).toContain('silent: true');
  });
});
