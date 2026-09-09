import Constants from 'expo-constants';

import { checkFingerprintAsync } from './checkFingerprintAsync';

// Announce this app's embedded fingerprint, so the dev server can warn when it is stale.
// Without one there is nothing to announce, and asking would spend seconds of server CPU on a
// hash nobody can compare.
if (Constants.fingerprint) {
  // Fire and forget: the server owns the comparison. The catch stops an unexpected failure
  // becoming an unhandled rejection on every app start.
  checkFingerprintAsync().catch(() => {});
}
