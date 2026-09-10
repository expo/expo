import ExpoModulesCore

final class LocationAccessGuard {
  private weak var appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func checkForegroundPermissions() throws {
    try checkPlistKey(LocationPlistKeys.whenInUse)
    try checkPermissions(
      requester: ForegroundPermissionsRequester.self,
      permission: (name: "LOCATION_FOREGROUND", request: "requestForegroundPermissionsAsync")
    )
  }

  func checkBackgroundPermissions() throws {
    try checkPlistKey(LocationPlistKeys.whenInUse)
    try checkPlistKey(LocationPlistKeys.alwaysAndWhenInUse)
    try checkPermissions(
      requester: BackgroundPermissionsRequester.self,
      permission: (name: "LOCATION_BACKGROUND", request: "requestBackgroundPermissionsAsync")
    )
  }

  private func checkPlistKey(_ key: String) throws {
    guard LocationPlistKeys.isIncludedInInfoPlist(key) else {
      throw MissingPlistKeyException(key)
    }
  }

  private func checkPermissions(requester: EXPermissionsRequester.Type, permission: (name: String, request: String)) throws {
    guard let permissionsManager = appContext?.permissions else {
      throw PermissionsModuleUnavailable()
    }
    if !permissionsManager.hasGrantedPermission(usingRequesterClass: requester) {
      throw MissingPermissionsException(permission)
    }
  }
}
