import ABI43_0_0ExpoModulesCore

public class TrackingTransparencyModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoTrackingTransparency")

    onCreate {
      ABI43_0_0EXPermissionsMethodsDelegate.register([ABI43_0_0EXTrackingPermissionRequester()], withPermissionsManager: self.appContext?.permissions)
    }

    method("getPermissionsAsync") { (promise: Promise) in
      ABI43_0_0EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: ABI43_0_0EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    method("requestPermissionsAsync") { (promise: Promise) in
      ABI43_0_0EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: ABI43_0_0EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }
}
