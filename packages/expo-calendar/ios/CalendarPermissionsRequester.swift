import ExpoModulesCore
import EventKit

public class CalendarPermissionsRequester: NSObject, EXPermissionsRequester {
  static public func permissionType() -> String {
    return "calendar"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    var status: EXPermissionStatus
    var permissions: EKAuthorizationStatus

    let calendarUsageDescription = Bundle.main.object(forInfoDictionaryKey: "NSCalendarsUsageDescription")
    if calendarUsageDescription == nil {
      permissions = .denied
    } else {
      permissions = EKEventStore.authorizationStatus(for: .event)
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
    eventStore.requestAccess(to: .event) { [weak self] _, error in
      guard let self else {
        return
      }
      if let error {
        reject("E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error)
      } else {
        resolve(self.getPermissions())
      }
    }
  }
}
