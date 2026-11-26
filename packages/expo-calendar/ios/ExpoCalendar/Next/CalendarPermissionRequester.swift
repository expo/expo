import ExpoModulesCore

class CalendarPermissionRequester {
  private weak var appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func getCalendarPermissions(_ writeOnly: Bool, promise: Promise) throws {
    try validatePlistKey(writeOnly)
    appContext?.permissions?.getPermissionUsingRequesterClass(
      requesterClass(writeOnly),
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  func requestCalendarPermissions(_ writeOnly: Bool, promise: Promise) throws {
    try validatePlistKey(writeOnly)
    appContext?.permissions?.askForPermission(
      usingRequesterClass: requesterClass(writeOnly),
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  private func validatePlistKey(_ writeOnly: Bool) throws {
    if writeOnly {
      guard CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarWriteOnly)
        || CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarFullAccess) else {
        throw MissingCalendarPListValueException(CalendarPlistKeys.calendarWriteOnly)
      }
    } else {
      guard CalendarPlistKeys.isIncludedInInfoPlist(CalendarPlistKeys.calendarFullAccess) else {
        throw MissingCalendarPListValueException(CalendarPlistKeys.calendarFullAccess)
      }
    }
  }

  private func requesterClass(_ writeOnly: Bool) -> EXPermissionsRequester.Type {
    if writeOnly {
      return CalendarWriteOnlyNextPermissionsRequester.self
    }
    return CalendarNextPermissionsRequester.self
  }
}
