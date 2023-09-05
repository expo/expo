import ExpoModulesCore
import EventKit

public class RemindersPermissionRequester: NSObject, EXPermissionsRequester {
  static public func permissionType() -> String {
    return "reminders"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    var status: EXPermissionStatus
    var permissions: EKAuthorizationStatus

    let remindersUsageDescription = Bundle.main.object(forInfoDictionaryKey: "NSRemindersUsageDescription")

    if remindersUsageDescription == nil {
      permissions = .denied
    } else {
      permissions = EKEventStore.authorizationStatus(for: .reminder)
    }

    switch permissions {
    case .authorized:
      status = EXPermissionStatusGranted
    case .restricted, .denied:
      status = EXPermissionStatusDenied
    case .notDetermined:
      status = EXPermissionStatusUndetermined
    }

    return ["status": status.rawValue]
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    let eventStore = EKEventStore()
    eventStore.requestAccess(to: .reminder) { [weak self] _, error in
      guard let self else {
        return
      }
      if let error {
        reject("E_REMINDERS_ERROR_UNKNOWN", error.localizedDescription, error)
      } else {
        resolve(self.getPermissions())
      }
    }
  }
}
