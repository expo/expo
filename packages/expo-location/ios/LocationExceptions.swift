// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

extension Exceptions {
  internal final class LocationUnavailable: Exception {
    override var reason: String {
      "Cannot obtain current location"
    }
  }

  internal final class LocationRequestCanceled: Exception {
    override var reason: String {
      "Requesting the location has been canceled"
    }
  }

  internal final class GeocodingNetwork: Exception {
    override var reason: String {
      "Geocoding rate limit exceeded - too many requests"
    }
  }

  internal final class GeocodingFailed: Exception {
    override var reason: String {
      "Error while geocoding a location"
    }
  }

  internal final class TaskManagerUnavailable: Exception {
    override var reason: String {
      "'expo-task-manager' module is required to use background services"
    }
  }

  internal final class LocationUpdatesUnavailable: Exception {
    override var reason: String {
      "Background location has not been configured, make sure to add 'location' to 'UIBackgroundModes' in the Info.plist file"
    }
  }

  internal final class HeadingUnavailableException: Exception {
    override var reason: String {
      "Heading updates not available"
    }
  }

  internal final class GeofencingUnavailable: Exception {
    override var reason: String {
      "Geofencing is not available"
    }
  }

  internal final class LocationServicesDisabled: Exception {
    override var reason: String {
      "Location services are disabled"
    }
  }

  internal final class DeniedForegroundLocationPermission: Exception {
    override var reason: String {
      "Location permission is required to do this operation"
    }
  }

  internal final class DeniedBackgroundLocationPermission: Exception {
    override var reason: String {
      "Background location permission is required to do this operation"
    }
  }
}
