import ExpoModulesCore

final class LocationAccessGuard {
  private weak var appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func checkPermissions(_ kind: LocationPermissionKind) throws {
    if let missingKey = LocationPlistKeys.firstMissing(in: kind.plistKeys) {
      throw MissingPlistKeyException(missingKey)
    }
    guard let permissionsManager = appContext?.permissions else {
      throw PermissionsModuleUnavailable()
    }
    guard permissionsManager.hasGrantedPermission(usingRequesterClass: kind.requesterClass) else {
      throw MissingPermissionsException(kind)
    }
  }
}
