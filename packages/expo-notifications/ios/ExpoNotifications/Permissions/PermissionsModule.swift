//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

public class PermissionsModule: Module {
  var permissionsManager: (any EXPermissionsInterface)?
  let requester = ExpoNotificationsPermissionsRequester()

  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationPermissionsModule")

    OnCreate {
      appContext?.permissions?.register([
        requester
      ])
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      appContext?
        .permissions?
        .getPermissionUsingRequesterClass(
          ExpoNotificationsPermissionsRequester.self,
          resolve: promise.resolver,
          reject: promise.legacyRejecter
        )
    }

    AsyncFunction("requestPermissionsAsync") { (requestedPermissions: NotificationPermissionRecord, promise: Promise) in
      let defaultAuthorizationOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      let options = requestedPermissions.numberOfOptionsRequested() > 0
        ? requestedPermissions.authorizationOptionValue()
        : defaultAuthorizationOptions
      requester.setAuthorizationOptions(options)

      // Call `requestAuthorization` directly to ensure new options are always
      // forwarded to the OS, even if notifications were previously granted.
      // iOS safely handles repeated calls to `requestAuthorization(options:)`.
      // Expo Go notifications permissions are not scoped
      requester.requestAuthorizationOptions(options, resolver: promise.resolver, rejecter: promise.legacyRejecter)
    }
  }
}
