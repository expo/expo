import ExpoModulesCore

// TODO: Requesting permission to change the brightness is not required on iOS.
// This is here for compatability reasons as it is required on Android.
// Should be removed when possible
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
