// Copyright 2025-present 650 Industries. All rights reserved.

import CoreLocation
import ExpoModulesCore

public final class LocationModuleNext: Module {

  public func definition() -> ModuleDefinition {
    Name("ExpoLocationNext")
    
    OnCreate {
      let permissionsManager = self.appContext?.permissions
      EXPermissionsMethodsDelegate.register(
        [
          EXForegroundPermissionRequester(),
          EXBackgroundLocationPermissionRequester()
        ],
        withPermissionsManager: permissionsManager
      )
    }
    
    AsyncFunction("getForegroundPermissionsAsync") { (promise: Promise) in
      try getPermissionUsingRequester(EXForegroundPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("requestForegroundPermissionsAsync") { (promise: Promise) in
      try askForPermissionUsingRequester(EXForegroundPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("getBackgroundPermissionsAsync") { (promise: Promise) in
      try getPermissionUsingRequester(EXBackgroundLocationPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("requestBackgroundPermissionsAsync") { (promise: Promise) in
      try askForPermissionUsingRequester(EXBackgroundLocationPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("hasServicesEnabledAsync") {
      return CLLocationManager.locationServicesEnabled()
    }
  }
}
