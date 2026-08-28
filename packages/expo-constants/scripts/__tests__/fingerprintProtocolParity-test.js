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

  // The embed script and the check side must compute byte-identical hashes, so their
  // fingerprint options must not drift either. Both declare them locally: the embed script
  // cannot import from @expo/cli, and the CLI resolves the fingerprint package from the
  // user's project at runtime.
  // TODO: these checks pin the option names, not their equivalence — an option added on one
  // side keeps both assertions passing. Exporting the options from `@expo/fingerprint`
  // (reachable as `expo/fingerprint`, which both sides already resolve from the project) would
  // prevent the drift instead of detecting it. expo-constants ships separately from `expo`, so
  // the embed script would still need a local fallback for older installs.
  it.each([
    ['the embed script', 'expo-constants/scripts/createFingerprintFile.js'],
    ['the check side (@expo/cli)', '@expo/cli/src/utils/nativeFingerprint.ts'],
  ])(`%s uses the shared fingerprint options`, (_description, file) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain('platforms: [platform]');
    expect(contents).toContain('silent: true');
  });
});

// The CLI triggers a fingerprint check on a physical iOS device with a deep link, and the native
// responder (expo-dev-launcher) posts the result back. `fingerprintCheckProtocol.ts` is the
// source of truth; this pins its literals against the native responder and the expo-linking
// filter that keeps the trigger URL from reaching app navigation. Each side declares its copy
// locally because Swift cannot import from the CLI.
describe('fingerprint-check protocol parity', () => {
  const packagesDir = path.join(__dirname, '..', '..', '..');

  it.each([
    [
      'the CLI (fingerprintCheckProtocol.ts)',
      '@expo/cli/src/needsRebuild/fingerprintCheckProtocol.ts',
      "FINGERPRINT_CHECK_URL_HOST = 'expo-fingerprint-check'",
    ],
    [
      'the dev-launcher responder (EXDevLauncherFingerprintCheck.swift)',
      'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift',
      'url.host == "expo-fingerprint-check"',
    ],
    [
      'the expo-linking filter (LinkingAppDelegateSubscriber.swift)',
      'expo-linking/ios/LinkingAppDelegateSubscriber.swift',
      'url.host == "expo-fingerprint-check"',
    ],
  ])(`%s declares the fingerprint-check URL host`, (_description, file, literal) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain(literal);
  });

  it.each([
    [
      'the CLI (fingerprintCheckProtocol.ts)',
      '@expo/cli/src/needsRebuild/fingerprintCheckProtocol.ts',
      "NONCE_PARAM = 'nonce'",
    ],
    [
      'the dev-launcher responder (EXDevLauncherFingerprintCheck.swift)',
      'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift',
      '$0.name == "nonce"',
    ],
  ])(`%s declares the nonce query param`, (_description, file, literal) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain(literal);
  });

  it.each([
    [
      'the CLI (fingerprintCheckProtocol.ts)',
      '@expo/cli/src/needsRebuild/fingerprintCheckProtocol.ts',
      "CALLBACK_PARAM = 'callback'",
    ],
    [
      'the dev-launcher responder (EXDevLauncherFingerprintCheck.swift)',
      'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift',
      '$0.name == "callback"',
    ],
  ])(`%s declares the callback query param`, (_description, file, literal) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain(literal);
  });

  it.each([
    [
      'the CLI (fingerprintCheckProtocol.ts)',
      '@expo/cli/src/needsRebuild/fingerprintCheckProtocol.ts',
      "NONCE_BODY_KEY = 'nonce'",
    ],
    [
      'the dev-launcher responder (EXDevLauncherFingerprintCheck.swift)',
      'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift',
      '"nonce": nonce',
    ],
  ])(`%s declares the nonce JSON body key`, (_description, file, literal) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain(literal);
  });

  it.each([
    [
      'the CLI (fingerprintCheckProtocol.ts)',
      '@expo/cli/src/needsRebuild/fingerprintCheckProtocol.ts',
      "FINGERPRINT_BODY_KEY = 'fingerprint'",
    ],
    [
      'the dev-launcher responder (EXDevLauncherFingerprintCheck.swift)',
      'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift',
      '"fingerprint": fingerprint',
    ],
  ])(`%s declares the fingerprint JSON body key`, (_description, file, literal) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain(literal);
  });

  it.each([
    [
      'the CLI (fingerprintCheckProtocol.ts)',
      '@expo/cli/src/needsRebuild/fingerprintCheckProtocol.ts',
      "CALLBACK_PATH = '/fingerprint-callback'",
    ],
    [
      'the dev-launcher responder (EXDevLauncherFingerprintCheck.swift)',
      'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift',
      'callback.path == "/fingerprint-callback"',
    ],
  ])(`%s declares the callback path`, (_description, file, literal) => {
    const contents = fs.readFileSync(path.join(packagesDir, file), 'utf8');
    expect(contents).toContain(literal);
  });

  it('the dev-launcher responder is gated behind #if DEBUG, the release-build SSRF mitigation', () => {
    const contents = fs.readFileSync(
      path.join(packagesDir, 'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift'),
      'utf8'
    );
    expect(contents).toContain('#if DEBUG');
  });

  it('the dev-launcher responder only allows the http callback scheme', () => {
    const contents = fs.readFileSync(
      path.join(packagesDir, 'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift'),
      'utf8'
    );
    // The check must require http exactly, and must not also allow https.
    expect(contents).toContain('callback.scheme == "http"');
    expect(contents).not.toContain('callback.scheme == "https"');
    expect(contents).not.toMatch(/callback\.scheme == "http"[^\n]*\|\|[^\n]*"https"/);
  });
});
