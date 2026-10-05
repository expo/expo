import ExpoModulesCore

struct LocationPermissionKind {
  let plistKeys: [String]
  let requesterClass: EXPermissionsRequester.Type

  static let foreground = LocationPermissionKind(
    plistKeys: [LocationPlistKeys.whenInUse],
    requesterClass: ForegroundPermissionsRequester.self
  )

  static let background = LocationPermissionKind(
    plistKeys: [LocationPlistKeys.whenInUse, LocationPlistKeys.alwaysAndWhenInUse],
    requesterClass: BackgroundPermissionsRequester.self
  )
}
