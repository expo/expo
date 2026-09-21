import CoreLocation
import ExpoModulesCore

public final class LocationNextModule: Module {
  private lazy var permissions = LocationPermissionsDelegate(appContext: appContext)
  private lazy var accessGuard = LocationAccessGuard(appContext: appContext)

  public func definition() -> ModuleDefinition {
    Name("LocationModuleNext")

    OnCreate {
      permissions.registerRequesters()
    }

    AsyncFunction("getForegroundPermissions") { (promise: Promise) in
      try permissions.getForegroundPermissions(promise)
    }

    AsyncFunction("requestForegroundPermissions") { (options: PermissionsRequestOptions?, promise: Promise) in
      try permissions.requestForegroundPermissions(options: options ?? PermissionsRequestOptions(), promise)
    }

    AsyncFunction("getBackgroundPermissions") { (promise: Promise) in
      try permissions.getBackgroundPermissions(promise)
    }

    AsyncFunction("requestBackgroundPermissions") { (options: PermissionsRequestOptions?, promise: Promise) in
      try permissions.requestBackgroundPermissions(options: options ?? PermissionsRequestOptions(), promise)
    }
  }
}
