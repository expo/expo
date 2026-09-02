import CoreMotion
import ExpoModulesCore

class MotionActivityPermissionRequester: NSObject, EXPermissionsRequester {
  // Retained until the query callback fires, then cleared.
  private var manager: CMMotionActivityManager?

  static func permissionType() -> String {
    "motionActivity"
  }

  func getPermissions() -> [AnyHashable: Any] {
    var status: EXPermissionStatus
    switch CMMotionActivityManager.authorizationStatus() {
    case .authorized:
      status = EXPermissionStatusGranted
    case .denied, .restricted:
      status = EXPermissionStatusDenied
    case .notDetermined:
      status = EXPermissionStatusUndetermined
    @unknown default:
      status = EXPermissionStatusUndetermined
    }
    return ["status": status.rawValue]
  }

  func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    guard CMMotionActivityManager.isActivityAvailable() else {
      resolve(getPermissions())
      return
    }
    guard CMMotionActivityManager.authorizationStatus() == .notDetermined else {
      resolve(getPermissions())
      return
    }
    // Issuing a short historical query is the standard way to trigger the system
    // Motion and Fitness permission prompt when the status is .notDetermined.
    manager = CMMotionActivityManager()
    manager?.queryActivityStarting(from: Date(timeIntervalSinceNow: -1), to: Date(), to: .main) { [weak self] _, _ in
      guard let self else {
        return
      }
      self.manager = nil
      resolve(self.getPermissions())
    }
  }
}
