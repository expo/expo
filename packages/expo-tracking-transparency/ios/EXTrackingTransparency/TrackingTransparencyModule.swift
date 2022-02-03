import ExpoModulesCore

public class TrackingTransparencyModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoTrackingTransparency")

    onCreate {
      EXPermissionsMethodsDelegate.register([EXTrackingPermissionRequester()], withPermissionsManager: self.appContext?.permissions)
    }

    function("getPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    function("requestPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }
}
