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
      // Expo Go notifications permissions are not scoped.
      // We use a selector on SDK 55 because Expo Go doesn't have `parsePermissionFromRequester` in the public header.
      let resolver: EXPromiseResolveBlock = { result in
        if let permission = result as? [AnyHashable: Any] {
          let selector = NSSelectorFromString("parsePermissionFromRequester:")
          if EXPermissionsService.responds(to: selector),
            let parsed = EXPermissionsService.perform(selector, with: permission)?.takeUnretainedValue() as? [AnyHashable: Any] {
            promise.resolver(parsed)
          } else {
            promise.legacyRejecter("ERR_PERMISSIONS_REQUEST_NOTIFICATIONS", "Unexpected error in requestPermissionsAsync: EXPermissionsService doesn't respond to parsePermissionFromRequester:", nil)
          }
        } else {
          promise.legacyRejecter("ERR_PERMISSIONS_REQUEST_NOTIFICATIONS", "Unexpected permission result type", nil)
        }
      }
      requester.requestAuthorizationOptions(options, resolver: resolver, rejecter: promise.legacyRejecter)
    }
  }
}
