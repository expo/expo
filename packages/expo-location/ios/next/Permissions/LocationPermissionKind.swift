import CoreLocation
import ExpoModulesCore

struct LocationPermissionKind {
  let plistKeys: [String]
  let requesterClass: EXPermissionsRequester.Type
  let grantingStatuses: [CLAuthorizationStatus]
  let permissionName: String
  let requestFunctionName: String

  static let foreground = LocationPermissionKind(
    plistKeys: [LocationPlistKeys.whenInUse],
    requesterClass: ForegroundPermissionsRequester.self,
    grantingStatuses: [.authorizedWhenInUse, .authorizedAlways],
    permissionName: "LOCATION_FOREGROUND",
    requestFunctionName: "requestForegroundPermissions"
  )

  static let background = LocationPermissionKind(
    plistKeys: [LocationPlistKeys.whenInUse, LocationPlistKeys.alwaysAndWhenInUse],
    requesterClass: BackgroundPermissionsRequester.self,
    grantingStatuses: [.authorizedAlways],
    permissionName: "LOCATION_BACKGROUND",
    requestFunctionName: "requestBackgroundPermissions"
  )
}
