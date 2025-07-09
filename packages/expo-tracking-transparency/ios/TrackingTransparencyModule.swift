import ExpoModulesCore
import AdSupport

public class TrackingTransparencyModule: Module {
  public func definition() -> ModuleDefinition {
    // TODO: Rename the package to 'ExpoTracking'
    Name("ExpoTrackingTransparency")

    OnCreate {
      EXPermissionsMethodsDelegate.register([TrackingTransparencyPermissionRequester()], withPermissionsManager: self.appContext?.permissions)
    }

    Function("getAdvertisingId") { () -> String in
      return ASIdentifierManager.shared().advertisingIdentifier.uuidString
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.getPermissionWithPermissionsManager(
        self.appContext?.permissions,
        withRequester: TrackingTransparencyPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
    .runOnQueue(.main)

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      EXPermissionsMethodsDelegate.askForPermission(
        withPermissionsManager: self.appContext?.permissions,
        withRequester: TrackingTransparencyPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }
    .runOnQueue(.main)
  }
}
