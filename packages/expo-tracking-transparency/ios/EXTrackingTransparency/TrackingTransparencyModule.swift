import ExpoModulesCore

public class TrackingTransparencyModule: Module {
  public static func definition() -> ModuleDefinition {
    name("ExpoTrackingTransparency")

    onCreate { module in
      EXPermissionsMethodsDelegate.register([EXTrackingPermissionRequester()], withPermissionsManager: module.appContext?.permissions)
    }

    method("getPermissionsAsync") { (module, promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        module.appContext?.permissions,
        withRequester: EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    method("requestPermissionsAsync") { (module, promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: module.appContext?.permissions,
        withRequester: EXTrackingPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
  }
}
