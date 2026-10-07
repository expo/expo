import CoreLocation
import ExpoModulesCore

struct LocationPermissionKind {
  let plistKeys: [String]
  let requesterClass: EXPermissionsRequester.Type
  let grantingStatuses: [CLAuthorizationStatus]

  static let foreground = LocationPermissionKind(
    plistKeys: [LocationPlistKeys.whenInUse],
    requesterClass: ForegroundPermissionsRequester.self,
    grantingStatuses: [.authorizedWhenInUse, .authorizedAlways]
  )

  static let background = LocationPermissionKind(
    plistKeys: [LocationPlistKeys.whenInUse, LocationPlistKeys.alwaysAndWhenInUse],
    requesterClass: BackgroundPermissionsRequester.self,
    grantingStatuses: [.authorizedAlways]
  )
}
