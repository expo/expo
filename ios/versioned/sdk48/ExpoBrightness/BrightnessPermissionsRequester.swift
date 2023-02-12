import ABI48_0_0ExpoModulesCore

// TODO: Requesting permission to change the brightness is not required on iOS.
// This is here for compatability reasons as it is required on Android.
// Should be removed when possible
class BrightnessPermissionsRequester: NSObject, ABI48_0_0EXPermissionsRequester {
  static func permissionType() -> String {
    return "systemBrightness"
  }

  func getPermissions() -> [AnyHashable: Any] {
    return ["status": ABI48_0_0EXPermissionStatusGranted.rawValue]
  }

  func requestPermissions(resolver resolve: ABI48_0_0EXPromiseResolveBlock, rejecter reject: ABI48_0_0EXPromiseRejectBlock) {
    resolve(getPermissions())
  }
}
