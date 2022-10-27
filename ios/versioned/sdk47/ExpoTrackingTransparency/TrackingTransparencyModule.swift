import ABI47_0_0ExpoModulesCore

public class TrackingTransparencyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoTrackingTransparency")

    OnCreate {
      ABI47_0_0EXPermissionsMethodsDelegate.register([TrackingTransparencyPermissionRequester()], withPermissionsManager: self.appContext?.permissions)
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      ABI47_0_0EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: TrackingTransparencyPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      ABI47_0_0EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: TrackingTransparencyPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }
}
