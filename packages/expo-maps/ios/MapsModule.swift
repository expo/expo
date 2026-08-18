// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class MapsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoMaps")

    OnCreate {
      guard let permissionsManager = appContext?.permissions else {
        return
      }
      permissionsManager.register([MapPermissionRequester()])
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      guard let permissionsManager = appContext?.permissions else {
        return
      }
      permissionsManager.getPermissionUsingRequesterClass(
        MapPermissionRequester.self,
        resolve: promise.legacyResolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      guard let permissionsManager = appContext?.permissions else {
        return
      }
      permissionsManager.askForPermission(
        usingRequesterClass: MapPermissionRequester.self,
        resolve: promise.legacyResolver,
        reject: promise.legacyRejecter
      )
    }
  }
}
