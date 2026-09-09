const fs = require('node:fs');
const path = require('node:path');

// The fingerprint check is a protocol across two repositories. The other side is
// `fingerprintCheckProtocol.ts` in expo/expo-agent-cli; neither side can import the other.
describe('fingerprint-check protocol parity', () => {
  const packagesDir = path.join(__dirname, '..', '..', '..');

  /** The protocol, as both repositories must spell it. */
  const PROTOCOL = {
    markerParam: '__expo_fingerprint_check',
    nonceParam: '__expo_fingerprint_nonce',
    callbackParam: '__expo_fingerprint_callback',
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
  ])(`%s matches the reserved marker parameter`, (_description, file) => {
    expect(read(file)).toContain(`$0.name == "${PROTOCOL.markerParam}" && $0.value == "1"`);
  });

  it.each([
    ['the dev-launcher responder', RESPONDER],
    ['the expo-linking filter', LINKING_FILTER],
  ])(`%s matches no URL host`, (_description, file) => {
    // A host-based trigger would take a name out of the app's own route namespace.
    expect(read(file)).not.toContain('url.host ==');
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
    expect(contents).toContain('callback.scheme == "http"');
    expect(contents).not.toContain('callback.scheme == "https"');
    expect(contents).not.toMatch(/callback\.scheme == "http"[^\n]*\|\|[^\n]*"https"/);
  });
});
