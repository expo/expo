import ExpoModulesCore
import EventKit
internal import React

public class CalendarNextPermissionsRequester: NSObject, EXPermissionsRequester {
  private let eventStore: EKEventStore

  init(eventStore: EKEventStore) {
    self.eventStore = eventStore
  }

  static public func permissionType() -> String {
    return "calendarNext"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    guard CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarFullAccess) else {
      return ["status": EXPermissionStatusDenied.rawValue, "canAskAgain": false]
    }
    let status = convertToExpoPermissionStatus(EKEventStore.authorizationStatus(for: .event))
    return ["status": status.rawValue, "canAskAgain": status == EXPermissionStatusUndetermined]
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    guard validateFullAccessPlistKey(reject) else {
      return
    }

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

  private func validateFullAccessPlistKey(_ reject: EXPromiseRejectBlock) -> Bool {
    guard CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarFullAccess) else {
      reject("E_MISSING_PLIST", "Cannot request calendar permissions because \(CalendarPlistKeys.calendarFullAccess) is missing from your Info.plist. Add it via the expo-calendar config plugin or manually.", nil)
      return false
    }
    return true
  }

  private func requestFullAccess(resolve: @escaping EXPromiseResolveBlock, reject: @escaping EXPromiseRejectBlock) {
    if #available(iOS 17.0, *) {
      eventStore.requestFullAccessToEvents { [weak self] _, error in
        self?.resolvePermissionsRequest(error: error, resolve: resolve, reject: reject)
      }
    } else {
      eventStore.requestAccess(to: .event) { [weak self] _, error in
        self?.resolvePermissionsRequest(error: error, resolve: resolve, reject: reject)
      }
    }
  }

  private func resolvePermissionsRequest(error: Error?, resolve: EXPromiseResolveBlock, reject: EXPromiseRejectBlock) {
    if let error {
      reject("E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error)
    } else {
      resolve(self.getPermissions())
    }
  }
}
