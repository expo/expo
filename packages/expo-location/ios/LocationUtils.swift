// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Converts iOS heading accuracy to Android system.
 3: high accuracy, 2: medium, 1: low, 0: none
 */
internal func normalizeAccuracy(_ accuracy: CLLocationDirection) -> Int {
  if accuracy > 50 || accuracy < 0 {
    return 0
  }
  if accuracy > 35 {
    return 1
  }
  if accuracy > 20 {
    return 2
  }
  return 3
}

internal func exportLocation(_ location: CLLocation) -> [String: Any] {
  return [
    "coords": [
      "latitude": location.coordinate.latitude,
      "longitude": location.coordinate.longitude,
      "altitude": location.altitude,
      "accuracy": location.horizontalAccuracy,
      "altitudeAccuracy": location.verticalAccuracy,
      "heading": location.course,
      "speed": location.speed
    ],
    "timestamp": location.timestamp.timeIntervalSince1970 * 1000
  ]
}

internal func handleCLError<ReturnType>(error: NSError, defaultValue: ReturnType) throws -> ReturnType {
  switch CLError.Code(rawValue: error.code) {
  case CLError.geocodeFoundNoResult, CLError.geocodeFoundPartialResult:
    return defaultValue
  case CLError.network:
    throw Exceptions.GeocodingNetwork()
  default:
    throw Exceptions.GeocodingFailed().causedBy(error)
  }
}

internal func ensureLocationServicesEnabled() throws {
  guard CLLocationManager.locationServicesEnabled() else {
    throw Exceptions.LocationServicesDisabled()
  }
}

// MARK: - Permissions

internal func getPermissionUsingRequester<Requester: EXPermissionsRequester>(
  _ requester: Requester.Type,
  appContext: AppContext?,
  promise: Promise
) throws {
  guard let permissionsManager = appContext?.permissions else {
    throw Exceptions.PermissionsModuleNotFound()
  }
  EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
    permissionsManager,
    withRequester: Requester.self,
    resolve: promise.resolver,
    reject: promise.legacyRejecter
  )
}

internal func askForPermissionUsingRequester<Requester: EXPermissionsRequester>(
  _ requester: Requester.Type,
  appContext: AppContext?,
  promise: Promise
) throws {
  guard let permissionsManager = appContext?.permissions else {
    throw Exceptions.PermissionsModuleNotFound()
  }
  EXPermissionsMethodsDelegate.askForPermission(
    withPermissionsManager: permissionsManager,
    withRequester: Requester.self,
    resolve: promise.resolver,
    reject: promise.legacyRejecter
  )
}

internal func checkPermissionWithRequester<Requester: EXPermissionsRequester>(
  _ requester: Requester.Type,
  appContext: AppContext?
) throws -> Bool {
  guard let permissionsManager = appContext?.permissions else {
    throw Exceptions.PermissionsModuleNotFound()
  }
  return permissionsManager.hasGrantedPermission(usingRequesterClass: Requester.self)
}

func ensureForegroundLocationPermissions(_ appContext: AppContext?) throws {
  guard try checkPermissionWithRequester(EXForegroundPermissionRequester.self, appContext: appContext) else {
    throw Exceptions.DeniedForegroundLocationPermission()
  }
}

func ensureBackgroundLocationPermissions(_ appContext: AppContext?) throws {
  guard try checkPermissionWithRequester(EXBackgroundLocationPermissionRequester.self, appContext: appContext) else {
    throw Exceptions.DeniedBackgroundLocationPermission()
  }
}

// MARK: - Other utils

func isLocation(_ location: CLLocation?, valid requirements: LastKnownLocationRequirements) -> Bool {
  guard let location else {
    return false
  }
  let timeDiff = -location.timestamp.timeIntervalSinceNow
  return timeDiff * 1000 <= requirements.maxAge && location.horizontalAccuracy <= requirements.requiredAccuracy
}
