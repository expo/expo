import ExpoModulesCore

final class PermissionsModuleUnavailable: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot check location permissions because the app context or its permissions service is no " +
    "longer available. This happens when the module outlives its app context, for example while " +
    "the app is reloading, or when the permissions service was not registered on that context. " +
    "Reload the app and try again; if the error persists, report it at " +
    "https://github.com/expo/expo/issues"
  }
}

final class PermissionRequestFailedException: Exception, @unchecked Sendable {
  override var reason: String {
    "The system reported an error while requesting location permissions, so the request could not " +
    "finish. This is rare and usually transient. Ask again; if it repeats, the attached error " +
    "describes what CoreLocation refused"
  }
}

final class MissingPlistKeyException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot access the location because '\(param)' is missing from your Info.plist. iOS refuses " +
    "location access to an app that does not declare why it needs it, so the permission can never be " +
    "granted. Add the key via the expo-location config plugin or by hand, then rebuild the app"
  }
}
