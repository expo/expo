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

    AsyncFunction("getPosition") { (options: GetPositionOptions?) -> Position? in
      guard CLLocationManager.locationServicesEnabled() else {
        throw LocationServicesDisabledGlobally()
      }
      try accessGuard.checkForegroundPermissions()

      let location = try await PositionRequester().get(options: options ?? GetPositionOptions())
      return location?.toPosition()
    }

    Function("watchPosition") { (profile: Profile?) -> PositionWatcher in
      guard CLLocationManager.locationServicesEnabled() else {
        throw LocationServicesDisabledGlobally()
      }
      try accessGuard.checkForegroundPermissions()

      let watcher = PositionWatcher(profile: profile ?? .default)
      watcher.start()
      return watcher
    }

    Class("PositionWatchHandle", PositionWatcher.self) {
      Function("pause") { (watcher: PositionWatcher) in
        watcher.pause()
      }

      Function("resume") { (watcher: PositionWatcher) -> Bool in
        watcher.resume()
      }

      Function("withProfile") { (watcher: PositionWatcher, profile: Profile) -> PositionWatcher in
        watcher.withProfile(profile)
        return watcher
      }

      Function("withInterval") { (watcher: PositionWatcher, intervalSeconds: Double) -> PositionWatcher in
        watcher.withInterval(intervalSeconds)
        return watcher
      }

      Function("restart") { (watcher: PositionWatcher) -> Bool in
        watcher.restart()
      }

      Function("status") { (watcher: PositionWatcher) -> PositionWatchStatus in
        watcher.status()
      }
    }

    OnAppEntersForeground {
      PositionWatcher.isAppInForeground = true
    }

    OnAppEntersBackground {
      PositionWatcher.isAppInForeground = false
    }

    Class(LocationUpdatesHandle.self) {
      Constructor { (taskName: String) -> LocationUpdatesHandle in
        LocationUpdatesHandle(taskName: taskName, accessGuard: accessGuard)
      }

      Function("withProfile") { (handle: LocationUpdatesHandle, profile: Profile) in
        handle.withProfile(profile)
      }

      AsyncFunction("start") { (handle: LocationUpdatesHandle) in
        try handle.start()
      }

      AsyncFunction("stop") { (handle: LocationUpdatesHandle) in
        try handle.stop()
      }

      AsyncFunction("hasStarted") { (handle: LocationUpdatesHandle) -> Bool in
        try handle.hasStarted()
      }
    }
  }
}
