import ExpoModulesCore

class BrightnessPermissionsRequester: NSObject, EXPermissionsRequester {
  static func permissionType() -> String {
    return "systemBrightness"
  }

  func getPermissions() -> [AnyHashable: Any] {
    return ["status": EXPermissionStatusGranted.rawValue]
  }

  func requestPermissions(resolver resolve: EXPromiseResolveBlock, rejecter reject: EXPromiseRejectBlock) {
    resolve(getPermissions())
  }
}
