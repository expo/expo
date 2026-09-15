import CoreLocation
import ExpoModulesCore

public final class LocationNextModule: Module {
  private lazy var permissions = LocationPermissionsDelegate(appContext: appContext)
  private lazy var accessGuard = LocationAccessGuard(appContext: appContext)

  public func definition() -> ModuleDefinition {
    Name("ExpoLocationNext")

    OnCreate {
      permissions.registerRequesters()
    }

    AsyncFunction("getForegroundPermissions") { (promise: Promise) in
      permissions.getForegroundPermissions(promise)
    }

    AsyncFunction("requestForegroundPermissions") { (options: PermissionsRequestOptions?, promise: Promise) in
      permissions.requestForegroundPermissions(options: options ?? PermissionsRequestOptions(), promise)
    }

    AsyncFunction("getBackgroundPermissions") { (promise: Promise) in
      permissions.getBackgroundPermissions(promise)
    }

    AsyncFunction("requestBackgroundPermissions") { (options: PermissionsRequestOptions?, promise: Promise) in
      permissions.requestBackgroundPermissions(options: options ?? PermissionsRequestOptions(), promise)
    }
  }
}
