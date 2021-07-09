import ExpoModulesCore

public class TrackingTransparencyModule: Module {
  public required init(appContext: AppContext) {
    super.init(appContext: appContext)

    // TODO: (@tsapeta) Make `onCreate` lifecycle event and move it there
    EXPermissionsMethodsDelegate.register([EXTrackingPermissionRequester()], withPermissionsManager: appContext.permissions)
  }

  public func definition() -> ModuleDefinition {
    name("ExpoTrackingTransparency")

    method("getPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.rejecter
      )
    }

    method("requestPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.rejecter
      )
    }
  }
}
