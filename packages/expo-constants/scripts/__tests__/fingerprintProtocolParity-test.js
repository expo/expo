const fs = require('node:fs');
const path = require('node:path');

const { FINGERPRINT_FILE_NAME } = require('../createFingerprintFile');

// `app.fingerprint` is a cross-package protocol. The writer (this package's build scripts) and
// the readers (native constants providers, `npx expo needs-rebuild`) each declare the file name
// locally because they cannot share code across languages and package boundaries. This test
// trips when any side renames its copy — a silent rename breaks the others without a failure
// anywhere near the change.
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
    [
      'the installed-app reader (@expo/cli)',
      '@expo/cli/src/needsRebuild/installedFingerprint.ts',
      "FINGERPRINT_FILE_NAME = 'app.fingerprint'",
    ],
  ])(`%s declares the same file name`, (_description, file, literal) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain(literal);
  });
});
