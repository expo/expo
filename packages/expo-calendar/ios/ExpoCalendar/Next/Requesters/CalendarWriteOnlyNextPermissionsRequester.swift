import ExpoModulesCore
import EventKit
internal import React

public class CalendarWriteOnlyNextPermissionsRequester: NSObject, EXPermissionsRequester {
  private let eventStore: EKEventStore

  init(eventStore: EKEventStore) {
    self.eventStore = eventStore
  }

  static public func permissionType() -> String {
    return "calendarWriteOnly"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    guard CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarWriteOnly)
      || CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarFullAccess) else {
      return ["status": EXPermissionStatusDenied.rawValue, "canAskAgain": false]
    }

    let status = convertToExpoPermissionStatus(EKEventStore.authorizationStatus(for: .event))

    return ["status": status.rawValue, "canAskAgain": status == EXPermissionStatusUndetermined]
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    guard CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarWriteOnly)
      || CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarFullAccess) else {
      reject("E_MISSING_PLIST", "Cannot request write-only calendar permissions because \(CalendarPlistKeys.calendarWriteOnly) is missing from your Info.plist. Enable `writeOnlyAccess` in the expo-calendar config plugin.", nil)
      return
    }

    requestWriteOnlyAccess(resolve: resolve, reject: reject)
  }

  private func convertToExpoPermissionStatus(_ authorizationStatus: EKAuthorizationStatus) -> EXPermissionStatus {
    switch authorizationStatus {
    case .restricted, .denied:
      return EXPermissionStatusDenied
    case .notDetermined:
      return EXPermissionStatusUndetermined
    case .writeOnly, .fullAccess:
      return EXPermissionStatusGranted
    @unknown default:
      return EXPermissionStatusUndetermined
    }
  }

  private func requestWriteOnlyAccess(resolve: @escaping EXPromiseResolveBlock, reject: @escaping EXPromiseRejectBlock) {
    if #available(iOS 17.0, *) {
      eventStore.requestWriteOnlyAccessToEvents { [weak self] _, error in
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
