import ABI45_0_0ExpoModulesCore

public class TrackingTransparencyModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoTrackingTransparency")

    onCreate {
      ABI45_0_0EXPermissionsMethodsDelegate.register([ABI45_0_0EXTrackingPermissionRequester()], withPermissionsManager: self.appContext?.permissions)
    }

    function("getPermissionsAsync") { (promise: Promise) in
      ABI45_0_0EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: ABI45_0_0EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    function("requestPermissionsAsync") { (promise: Promise) in
      ABI45_0_0EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: ABI45_0_0EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }
}
