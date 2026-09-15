import ExpoModulesCore

internal final class LocationServicesDisabledGlobally: Exception, @unchecked Sendable {
  override var reason: String {
    "Location Services are turned off for the whole device, so no app can receive location updates. " +
    "This is a system-wide setting the app cannot change or prompt for. Ask the user to enable it in " +
    "Settings > Privacy & Security > Location Services"
  }
}

internal final class PermissionsModuleUnavailable: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot check location permissions because the permissions service of 'expo-modules-core' is " +
    "missing from this app. The Expo module system registers it at startup, so this usually means " +
    "the app was built without 'expo-modules-core'. Reinstall the dependencies and rebuild the app"
  }
}

internal final class MissingPurposeKeyException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot ask for temporary full accuracy because the purpose key \"\(param)\" is missing from " +
    "\(TemporaryFullAccuracyPlistKeys.purposeDictionary) in your Info.plist. " +
    "Add it via the expo-location config plugin or manually - the value is the message the system shows to the user"
  }
}

internal final class TemporaryFullAccuracyFailedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Requesting temporary full accuracy failed"
  }
}

internal final class MissingPermissionsException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "\(param) permission is required to do this operation"
  }
}

internal final class PermissionRequestFailedException: Exception, @unchecked Sendable {
  override var reason: String {
    "The system reported an error while requesting location permissions, so the request could not " +
    "finish. This is rare and usually transient. Ask again; if it repeats, the attached error " +
    "describes what CoreLocation refused"
  }
}

internal final class PermissionRequestInProgressException: Exception, @unchecked Sendable {
  override var reason: String {
    "A request for this location permission is already in progress. Wait for it to finish before requesting it again"
  }
}

internal final class MissingPlistKeyException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot access the location because '\(param)' is missing from your Info.plist. iOS refuses " +
    "location access to an app that does not declare why it needs it, so the permission can never be " +
    "granted. Add the key via the expo-location config plugin or by hand, then rebuild the app"
  }
}
