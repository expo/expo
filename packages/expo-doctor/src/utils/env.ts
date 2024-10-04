import { boolish } from 'getenv';

class Env {
  /** Is running in non-interactive CI mode */
  get CI() {
    return boolish('CI', false);
  }

  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  }

  /** Enable staging API environment */
  get EXPO_STAGING() {
    return boolish('EXPO_STAGING', false);
  }

  /** Allow disabling InstalledDependencyVersionCheck */
  get EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK() {
    return boolish('EXPO_DOCTOR_SKIP_DEPENDENCY_VERSION_CHECK', false);
  }
}

export const env = new Env();
