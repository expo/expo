import EventKit
import ExpoModulesCore
import Foundation

public class ExpoCalendarPermissions {
  private var permittedEntities: EKEntityMask = .event
  private let eventStore: EKEventStore
  private weak var appContext: AppContext?

  init(eventStore: EKEventStore, appContext: AppContext?) {
    self.eventStore = eventStore
    self.appContext = appContext
  }

  public func initializePermittedEntities() {
    guard let permissionsManager = appContext?.permissions else {
      return
    }
    var permittedEntities: EKEntityMask = []
    if permissionsManager.hasGrantedPermission(
      usingRequesterClass: CalendarPermissionsRequester.self) {
      permittedEntities.insert(.event)
    }

    if permissionsManager.hasGrantedPermission(
      usingRequesterClass: RemindersPermissionRequester.self) {
      permittedEntities.insert(.reminder)
    }

    self.permittedEntities = permittedEntities
  }

  public func checkCalendarPermissions() throws {
    try self.checkPermissions(entity: .event)
  }

  public func checkRemindersPermissions() throws {
    try self.checkPermissions(entity: .reminder)
  }

  private func checkPermissions(entity: EKEntityType) throws {
    guard let permissionsManager = appContext?.permissions else {
      throw PermissionsManagerNotFoundException()
    }

    var requester: EXPermissionsRequester.Type?
    switch entity {
    case .event:
      requester = CalendarPermissionsRequester.self
    case .reminder:
      requester = RemindersPermissionRequester.self
    @unknown default:
      requester = nil
    }
    if let requester, !permissionsManager.hasGrantedPermission(usingRequesterClass: requester) {
      let message = requester.permissionType().uppercased()
      throw MissionPermissionsException(message)
    }

    resetEventStoreIfPermissionWasChanged(entity: entity)
  }

  public func resetEventStoreIfPermissionWasChanged(entity: EKEntityType) {
    // looks redundant but these are different types.
    if entity == .event {
      if permittedEntities.contains(.event) {
        return
      }
    } else if entity == .reminder {
      if permittedEntities.contains(.reminder) {
        return
      }
    }

    eventStore.reset()
    permittedEntities.insert(entity == .event ? .event : .reminder)
  }
}
