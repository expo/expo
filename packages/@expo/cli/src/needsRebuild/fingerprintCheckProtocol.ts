/**
 * The contract between the needs-rebuild CLI and the native fingerprint responder
 * (expo-dev-launcher's EXDevLauncherFingerprintCheck.swift). The CLI triggers the app with a URL
 * whose host is FINGERPRINT_CHECK_URL_HOST; the app posts the embedded fingerprint back to the
 * callback URL. Every literal lives here so the protocol parity test can pin both sides.
 */

/** URL host that marks a fingerprint-check trigger. The responder matches the host, never the scheme. */
export const FINGERPRINT_CHECK_URL_HOST = 'expo-fingerprint-check';

/** Query parameter carrying the one-time nonce that ties a response to this CLI invocation. */
export const NONCE_PARAM = 'nonce';

/** Query parameter carrying the URL the app posts its response to. */
export const CALLBACK_PARAM = 'callback';

/** JSON key for the nonce in the response body. */
export const NONCE_BODY_KEY = 'nonce';

/** JSON key for the embedded fingerprint in the response body; null when no stamp is embedded. */
export const FINGERPRINT_BODY_KEY = 'fingerprint';

/** Path of the callback endpoint the CLI listens on. */
export const CALLBACK_PATH = '/fingerprint-callback';

/** How long the CLI waits for the app's response. A timeout means "cannot determine", never "up to date". */
export const DEFAULT_RESPONSE_TIMEOUT_MS = 15_000;

/**
 * Build the trigger URL that devicectl passes to the app.
 * Falls back to the check host as the scheme when the project declares none, so the
 * `launch --payload-url` path (which targets a bundle id, not a scheme) still works.
 */
export function buildFingerprintCheckUrl(
  scheme: string | null,
  nonce: string,
  callbackUrl: string
): string {
  const resolvedScheme = scheme ?? FINGERPRINT_CHECK_URL_HOST;
  const params = new URLSearchParams({ [NONCE_PARAM]: nonce, [CALLBACK_PARAM]: callbackUrl });
  return `${resolvedScheme}://${FINGERPRINT_CHECK_URL_HOST}?${params}`;
}
