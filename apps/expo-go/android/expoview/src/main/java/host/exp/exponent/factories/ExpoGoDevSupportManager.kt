package host.exp.exponent.factories

/**
 * Expo Go runs one Activity per open project, so its dev support managers are scoped to one. Reload
 * and manifest lookups are keyed on that Activity, and both the dev and release managers need it.
 */
internal interface ExpoGoDevSupportManager {
  var exponentActivityId: Int
}
