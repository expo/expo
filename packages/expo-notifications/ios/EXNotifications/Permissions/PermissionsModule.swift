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
      EXUserFacingNotificationsPermissionsRequester.setRequestedPermissions(requestedPermissions.toDictionary())
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

struct NotificationPermissionRecord: Record {
  @Field
  var allowAlert: Bool?
  @Field
  var allowBadge: Bool?
  @Field
  var allowSound: Bool?
  @Field
  var allowDisplayInCarPlay: Bool?
  @Field
  var allowCriticalAlerts: Bool?
  @Field
  var provideAppNotificationSettings: Bool?
  @Field
  var allowProvisional: Bool?

  func count() -> Int {
    return (self.allowAlert != nil ? 1 : 0) +
    (self.allowBadge != nil ? 1 : 0) +
    (self.allowSound != nil ? 1 : 0) +
    (self.allowDisplayInCarPlay != nil ? 1 : 0) +
    (self.allowCriticalAlerts != nil ? 1 : 0) +
    (self.provideAppNotificationSettings != nil ? 1 : 0) +
    (self.allowProvisional != nil ? 1 : 0)
  }

  func authorizationOptionValue() -> UNAuthorizationOptions {
    var options: UNAuthorizationOptions = []
    if self.allowAlert ?? false { options.insert(.alert) }
    if self.allowBadge ?? false { options.insert(.badge) }
    if self.allowSound ?? false { options.insert(.sound) }
    if self.allowDisplayInCarPlay ?? false { options.insert(.carPlay) }
    if self.allowCriticalAlerts ?? false { options.insert(.criticalAlert) }
    if self.provideAppNotificationSettings ?? false { options.insert(.providesAppNotificationSettings) }
    if self.allowProvisional ?? false { options.insert(.provisional) }
    return options
  }
}
