import ExpoModulesCore
import EventKit

public class RemindersPermissionRequester: NSObject, EXPermissionsRequester {
  private let eventStore: EKEventStore

  init(eventStore: EKEventStore) {
    self.eventStore = eventStore
  }

  static public func permissionType() -> String {
    return "reminders"
  }

  public func getPermissions() -> [AnyHashable: Any] {
    var status: CalendarPermissionsStatus
    var permissions: EKAuthorizationStatus

    let description = {
      if #available(iOS 17.0, *) {
        return "NSRemindersFullAccessUsageDescription"
      }
      return "NSRemindersUsageDescription"
    }()

    if let remindersUsageDescription = Bundle.main.object(forInfoDictionaryKey: description) {
      permissions = EKEventStore.authorizationStatus(for: .reminder)
    } else {
      EXFatal(MissingCalendarPListValueException(description))
      permissions = .denied
    }

    switch permissions {
    case .restricted, .denied:
      status = .denied
    case .notDetermined:
      status = .notDetermined
    case .fullAccess:
      status = .granted
    @unknown default:
      status = .unknown
    }

    return ["status": status.rawValue]
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    if #available(iOS 17.0, *) {
      eventStore.requestFullAccessToReminders { [weak self] _, error in
        guard let self else {
          return
        }
        if let error {
          reject("E_REMINDERS_ERROR_UNKNOWN", error.localizedDescription, error)
        } else {
          resolve(self.getPermissions())
        }
      }
    } else {
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
}
