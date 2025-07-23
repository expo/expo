//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

public class PermissionsModule: Module {
  var permissionsManager: (any EXPermissionsInterface)?
  var requester: EXUserFacingNotificationsPermissionsRequester =
    EXUserFacingNotificationsPermissionsRequester()

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
          EXUserFacingNotificationsPermissionsRequester.self,
          resolve: promise.resolver,
          reject: promise.legacyRejecter
        )
    }

    AsyncFunction("requestPermissionsAsync") { (requestedPermissions: NotificationPermissionRecord, promise: Promise) in
      let defaultAuthorizationOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      requester.authorizationOptions = requestedPermissions.numberOfOptionsRequested() > 0
        ? requestedPermissions.authorizationOptionValue()
        : defaultAuthorizationOptions

      appContext?
        .permissions?
        .askForPermission(
          usingRequesterClass: EXUserFacingNotificationsPermissionsRequester.self,
          resolve: promise.resolver,
          reject: promise.legacyRejecter
        )
    }
  }
}
