import EventKit
import ExpoModulesCore
import Foundation

public class CalendarAccessGuard {
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
      usingRequesterClass: CalendarNextPermissionsRequester.self) {
      permittedEntities.insert(.event)
    }

    if permissionsManager.hasGrantedPermission(
      usingRequesterClass: RemindersNextPermissionRequester.self) {
      permittedEntities.insert(.reminder)
    }

    self.permittedEntities = permittedEntities
  }

  public func checkCalendarPermissions() throws {
    try self.checkPermissions(
      entity: .event,
      requester: CalendarNextPermissionsRequester.self,
      permissionName: "CALENDAR"
    )
  }

  public func checkCalendarWritePermissions() throws {
    try self.checkPermissions(
      entity: .event,
      requester: CalendarWriteOnlyNextPermissionsRequester.self,
      permissionName: "CALENDARWRITEONLY"
    )
  }

  public func checkRemindersPermissions() throws {
    try self.checkPermissions(
      entity: .reminder,
      requester: RemindersNextPermissionRequester.self,
      permissionName: "REMINDERS"
    )
  }

  private func checkPermissions(
    entity: EKEntityType,
    requester: EXPermissionsRequester.Type,
    permissionName: String
  ) throws {
    guard let permissionsManager = appContext?.permissions else {
      throw PermissionsManagerNotFoundException()
    }

    if !permissionsManager.hasGrantedPermission(usingRequesterClass: requester) {
      throw MissionPermissionsException(permissionName)
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
