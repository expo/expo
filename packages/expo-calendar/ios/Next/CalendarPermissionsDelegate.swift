import ExpoModulesCore

class CalendarPermissionsDelegate {
  private weak var appContext: AppContext?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }

  func getCalendarPermissions(_ options: CalendarPermissionOptions?, promise: Promise) {
    appContext?.permissions?.getPermissionUsingRequesterClass(
      requesterClass(for: options),
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  func requestCalendarPermissions(_ options: CalendarPermissionOptions?, promise: Promise) {
    appContext?.permissions?.askForPermission(
      usingRequesterClass: requesterClass(for: options),
      resolve: promise.legacyResolver,
      reject: promise.legacyRejecter
    )
  }

  private func requesterClass(for options: CalendarPermissionOptions?) -> EXPermissionsRequester.Type {
    if options?.writeOnly == true {
      return CalendarWriteOnlyPermissionsRequester.self
    }
    return CalendarPermissionsRequester.self
  }
}
