const fs = require('node:fs');
const path = require('node:path');

const { FINGERPRINT_FILE_NAME } = require('../createFingerprintFile');

// `app.fingerprint` is a protocol: the writer and every reader declare the name locally, because
// they cannot share code across languages. A rename would otherwise fail far from the change.
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

  // The file holds `{"hash": ..., "fingerprintVersion": ...}`. Each side spells those keys itself.
  it.each([
    ['the writer', 'expo-constants/scripts/createFingerprintFile.js', 'hash,'],
    [
      'the Android reader',
      'expo-constants/android/src/main/java/expo/modules/constants/ConstantsService.kt',
      'optString("hash")',
    ],
    ['the iOS reader', 'expo-modules-core/ios/Utilities/ConstantsProvider.swift', 'parsed["hash"]'],
  ])(`%s declares the hash key`, (_description, file, literal) => {
    expect(fs.readFileSync(path.join(packagesDir, file), 'utf8')).toContain(literal);
  });

  // The reader (`src/project/fingerprint.ts` in expo/expo-agent-cli) declares the same options.
  // TODO: this pins the names, not their equivalence. Exporting them from `@expo/fingerprint` would
  // prevent the drift instead of detecting it.
  it(`the embed script uses the shared fingerprint options`, () => {
    const file = 'expo-constants/scripts/createFingerprintFile.js';
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain('platforms: [platform]');
    expect(contents).toContain('silent: true');
  });
});
