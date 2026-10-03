import ExpoModulesCore

struct LocationPermissionKind {
  let plistKeys: [String]
  let requesterClass: EXPermissionsRequester.Type
  let permissionName: String
  let requestFunctionName: String

  static let foreground = LocationPermissionKind(
    plistKeys: [LocationPlistKeys.whenInUse],
    requesterClass: ForegroundPermissionsRequester.self,
    permissionName: "LOCATION_FOREGROUND",
    requestFunctionName: "requestForegroundPermissionsAsync"
  )

  static let background = LocationPermissionKind(
    plistKeys: [LocationPlistKeys.whenInUse, LocationPlistKeys.alwaysAndWhenInUse],
    requesterClass: BackgroundPermissionsRequester.self,
    permissionName: "LOCATION_BACKGROUND",
    requestFunctionName: "requestBackgroundPermissionsAsync"
  )
}
