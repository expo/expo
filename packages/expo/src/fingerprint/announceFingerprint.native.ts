import Constants from 'expo-constants';

import { checkFingerprintAsync } from './checkFingerprintAsync';

// Announce the fingerprint embedded in this app to the development server, which compares it
// against the current project fingerprint and warns in the terminal when the installed app is
// stale. `checkFingerprintAsync` announces through the same request that reads the server
// fingerprint, so the automatic announcement and the public API are one code path.
//
// Without an embedded fingerprint there is nothing to announce, and asking anyway would make the
// server compute a project fingerprint (seconds of CPU) that no one can compare against.
if (Constants.fingerprint) {
  // Fire-and-forget: the server owns the comparison and the messaging. The check resolves for
  // every failure it knows about; the catch keeps an unexpected one from surfacing as an
  // unhandled rejection on every app start.
  checkFingerprintAsync().catch(() => {});
}
