import ExpoModulesCore

class LocationAccessGuard {
  private weak var appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func checkForegroundPermissions() throws {
    try checkPlistKey(LocationPlistKeys.whenInUse)
    try checkPermissions(requester: ForegroundPermissionsRequester.self, permissionName: "LOCATION_FOREGROUND")
  }

  func checkBackgroundPermissions() throws {
    try checkPlistKey(LocationPlistKeys.whenInUse)
    try checkPlistKey(LocationPlistKeys.alwaysAndWhenInUse)
    try checkPermissions(requester: BackgroundPermissionsRequester.self, permissionName: "LOCATION_BACKGROUND")
  }

  private func checkPlistKey(_ key: String) throws {
    guard LocationPlistKeys.isIncludedInInfoPlist(key) else {
      throw MissingPlistKeyException(key)
    }
  }

  private func checkPermissions(requester: EXPermissionsRequester.Type, permissionName: String) throws {
    guard let permissionsManager = appContext?.permissions else {
      throw PermissionsModuleUnavailable()
    }
    if !permissionsManager.hasGrantedPermission(usingRequesterClass: requester) {
      throw MissingPermissionsException(permissionName)
    }
  }
}
