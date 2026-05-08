import ExpoModulesCore
import EventKit
internal import React

public class RemindersNextPermissionRequester: NSObject, EXPermissionsRequester {
  private let eventStore: EKEventStore

  init(eventStore: EKEventStore) {
    self.eventStore = eventStore
  }

  static public func permissionType() -> String {
    return "remindersNext"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    let status = convertToExpoPermissionStatus(EKEventStore.authorizationStatus(for: .reminder))

    return ["status": status.rawValue, "canAskAgain": status == EXPermissionStatusUndetermined]
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    requestFullAccess(resolve: resolve, reject: reject)
  }

  private func convertToExpoPermissionStatus(_ authorizationStatus: EKAuthorizationStatus) -> EXPermissionStatus {
    switch authorizationStatus {
    case .restricted, .denied, .writeOnly:
      return EXPermissionStatusDenied
    case .notDetermined:
      return EXPermissionStatusUndetermined
    case .fullAccess:
      return EXPermissionStatusGranted
    @unknown default:
      return EXPermissionStatusUndetermined
    }
  }

  private func requestFullAccess(resolve: @escaping EXPromiseResolveBlock, reject: @escaping EXPromiseRejectBlock) {
    if #available(iOS 17.0, *) {
      eventStore.requestFullAccessToReminders { [weak self] _, error in
        self?.resolvePermissionsRequest(error: error, resolve: resolve, reject: reject)
      }
    } else {
      eventStore.requestAccess(to: .reminder) { [weak self] _, error in
        self?.resolvePermissionsRequest(error: error, resolve: resolve, reject: reject)
      }
    }
  }

  private func resolvePermissionsRequest(error: Error?, resolve: EXPromiseResolveBlock, reject: EXPromiseRejectBlock) {
    if let error {
      reject("E_REMINDERS_ERROR_UNKNOWN", error.localizedDescription, error)
    } else {
      resolve(self.getPermissions())
    }
  }
}
