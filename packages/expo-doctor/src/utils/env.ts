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

  /** Opt in to ReactNativeDirectoryCheck */
  get EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK() {
    if (typeof process.env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK === 'undefined') {
      return null;
    }

    return boolish('EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK', false);
  }

  /** If a test makes an online check and failures due to a network error, don't count it as failing the overall doctor check */
  get EXPO_DOCTOR_WARN_ON_NETWORK_ERRORS() {
    return boolish('EXPO_DOCTOR_WARN_ON_NETWORK_ERRORS', false);
  }
}

export const env = new Env();
