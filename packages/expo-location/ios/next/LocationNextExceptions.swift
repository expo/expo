import ExpoModulesCore

final class InvalidLocationTimeoutException: Exception, @unchecked Sendable {
  override var reason: String {
    "Location timeout must be a non-negative number of seconds or positive Infinity"
  }
}

final class LocationAuthorizationDenied: Exception, @unchecked Sendable {
  override var reason: String {
    "Location access for this app has been turned off, so the updates stopped. The user changed it " +
    "in Settings while the app was running, and requesting the permission again will not prompt " +
    "them - iOS only asks once. Ask the user to allow location for this app in Settings, then start " +
    "watching again"
  }
}

final class LocationAuthorizationRestricted: Exception, @unchecked Sendable {
  override var reason: String {
    "Location access is restricted on this device, so the app cannot receive location updates. " +
    "Authorization changes are prevented by parental restrictions, an MDM configuration, or another " +
    "device policy, not by the user's choice, so requesting the permission again will not help. Ask " +
    "the user to check Screen Time content and privacy restrictions, or contact whoever manages the device"
  }
}

final class LocationServiceSessionRequired: Exception, @unchecked Sendable {
  override var reason: String {
    "Location updates stopped because this app sets 'CLRequireExplicitServiceSession' in its " +
    "Info.plist, which makes the system refuse updates unless the app holds a CLServiceSession. " +
    "'expo-location' does not create one. Remove that key from your Info.plist, or manage the session " +
    "yourself and use CoreLocation directly"
  }
}

final class LocationUpdatesEndedUnexpectedly: Exception, @unchecked Sendable {
  override var reason: String {
    "The system stopped delivering location updates without reporting a reason, and the app did not " +
    "stop them. Start the updates again; if this repeats, check that location permissions are still " +
    "granted and that Location Services are enabled"
  }
}

final class LocationServicesDisabledGlobally: Exception, @unchecked Sendable {
  override var reason: String {
    "Location Services are turned off for the whole device, so no app can receive location updates. " +
    "This is a system-wide setting the app cannot change or prompt for. Ask the user to enable it in " +
    "Settings > Privacy & Security > Location Services"
  }
}

final class PermissionsModuleUnavailable: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot check location permissions because the permissions service of 'expo-modules-core' is " +
    "missing from this app. The Expo module system registers it at startup, so this usually means " +
    "the app was built without 'expo-modules-core'. Reinstall the dependencies and rebuild the app"
  }
}

final class MissingPermissionsException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "\(param) permission is required to do this operation"
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
