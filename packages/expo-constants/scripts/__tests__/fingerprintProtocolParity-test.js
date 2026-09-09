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

// The device fingerprint check is a protocol across two repositories: a tool triggers it with a
// deep link, and the responder here posts the result back. The other side is
// `fingerprintCheckProtocol.ts` in expo/expo-agent-cli, which Swift cannot import and this test
// cannot read, so both sides pin the literals and this trips on a one-sided change.
describe('fingerprint-check protocol parity', () => {
  const packagesDir = path.join(__dirname, '..', '..', '..');

  /** The protocol, as both repositories must spell it. */
  const PROTOCOL = {
    urlHost: 'expo-fingerprint-check',
    nonceParam: 'nonce',
    callbackParam: 'callback',
    callbackPath: '/fingerprint-callback',
    nonceBodyKey: 'nonce',
    fingerprintBodyKey: 'fingerprint',
  };

  const RESPONDER = 'expo-dev-launcher/ios/EXDevLauncherFingerprintCheck.swift';
  const LINKING_FILTER = 'expo-linking/ios/LinkingAppDelegateSubscriber.swift';

  function read(file) {
    return fs.readFileSync(path.join(packagesDir, file), 'utf8');
  }

  it.each([
    ['the dev-launcher responder', RESPONDER],
    ['the expo-linking filter that keeps the trigger out of app navigation', LINKING_FILTER],
  ])(`%s matches the fingerprint-check URL host`, (_description, file) => {
    expect(read(file)).toContain(`url.host == "${PROTOCOL.urlHost}"`);
  });

  it.each([
    ['the nonce query param', `$0.name == "${PROTOCOL.nonceParam}"`],
    ['the callback query param', `$0.name == "${PROTOCOL.callbackParam}"`],
    ['the callback path', `callback.path == "${PROTOCOL.callbackPath}"`],
    ['the nonce body key', `"${PROTOCOL.nonceBodyKey}": nonce`],
    ['the fingerprint body key', `"${PROTOCOL.fingerprintBodyKey}": fingerprint`],
  ])(`the dev-launcher responder declares %s`, (_description, literal) => {
    expect(read(RESPONDER)).toContain(literal);
  });

  it('the dev-launcher responder is gated behind #if DEBUG, the release-build SSRF mitigation', () => {
    expect(read(RESPONDER)).toContain('#if DEBUG');
  });

  it('the dev-launcher responder only allows the http callback scheme', () => {
    const contents = read(RESPONDER);
    // The check must require http exactly, and must not also allow https.
    expect(contents).toContain('callback.scheme == "http"');
    expect(contents).not.toContain('callback.scheme == "https"');
    expect(contents).not.toMatch(/callback\.scheme == "http"[^\n]*\|\|[^\n]*"https"/);
  });
});
