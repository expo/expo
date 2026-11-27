import ExpoModulesCore

class MotionActivityPermissionRequester: NSObject, EXPermissionsRequester {
  static func permissionType() -> String {
    "motionActivity"
  }

  func getPermissions() -> [AnyHashable: Any] {
    let status: EXPermissionStatus
    switch MotionActivityRegistry.provider?.authorization {
    case .authorized:
      status = EXPermissionStatusGranted
    case .notDetermined:
      status = EXPermissionStatusUndetermined
    case .deniedOrRestricted, nil:
      status = EXPermissionStatusDenied
    }
    return ["status": status.rawValue]
  }

  func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    guard let provider = MotionActivityRegistry.provider,
      provider.isActivityAvailable,
      provider.authorization == .notDetermined
    else {
      resolve(getPermissions())
      return
    }
    provider.requestAuthorization {
      resolve(self.getPermissions())
    }
  }
}
