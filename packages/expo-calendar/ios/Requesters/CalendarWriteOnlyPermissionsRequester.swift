import ExpoModulesCore
import EventKit
internal import React

public class CalendarWriteOnlyPermissionsRequester: NSObject, EXPermissionsRequester {
  private let eventStore: EKEventStore

  init(eventStore: EKEventStore) {
    self.eventStore = eventStore
  }

  static public func permissionType() -> String {
    return "calendarWriteOnly"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    var status: EXPermissionStatus
    var permissions: EKAuthorizationStatus

    let description = {
      if #available(iOS 17.0, *) {
        return "NSCalendarsWriteOnlyAccessUsageDescription"
      }
      return "NSCalendarsUsageDescription"
    }()

    if Bundle.main.object(forInfoDictionaryKey: description) != nil {
      permissions = EKEventStore.authorizationStatus(for: .event)
    } else {
      RCTFatal(MissingCalendarPListValueException(description))
      permissions = .denied
    }

    switch permissions {
    case .restricted, .denied:
      status = EXPermissionStatusDenied
    case .notDetermined:
      status = EXPermissionStatusUndetermined
    case .writeOnly, .fullAccess:
      status = EXPermissionStatusGranted
    @unknown default:
      status = EXPermissionStatusUndetermined
    }

    return ["status": status.rawValue]
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    if #available(iOS 17.0, *) {
      eventStore.requestWriteOnlyAccessToEvents { [weak self] _, error in
        guard let self else {
          return
        }
        if let error {
          reject("E_CALENDAR_ERROR_UNKNOWN", error.localizedDescription, error)
        } else {
          resolve(self.getPermissions())
        }
      }
    } else {
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
}
