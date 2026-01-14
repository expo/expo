// Copyright 2019-present 650 Industries. All rights reserved.

import ExpoModulesCore
import UserNotifications

public class ExpoNotificationsPermissionsRequester: NSObject, EXPermissionsRequester {
  private var authorizationOptions: UNAuthorizationOptions = []

  public static func permissionType() -> String {
    return "userFacingNotifications"
  }

  public func setAuthorizationOptions(_ options: UNAuthorizationOptions) {
    self.authorizationOptions = options
  }

  public func getPermissions() -> [AnyHashable: Any] {
    // semaphore.wait() blocks the current thread, we want to be sure not to block main
    dispatchPrecondition(condition: .notOnQueue(.main))
    let semaphore = DispatchSemaphore(value: 0)
    var result: [AnyHashable: Any] = [:]

    Task.detached {
      result = await self.getPermissionsAsync()
      semaphore.signal()
    }

    semaphore.wait()
    return result
  }

  private func getPermissionsAsync() async -> [AnyHashable: Any] {
    let settings = await UNUserNotificationCenter.current().notificationSettings()

    let generalStatus: EXPermissionStatus = switch settings.authorizationStatus {
    case .authorized:
      EXPermissionStatusGranted
    case .denied:
      EXPermissionStatusDenied
    default:
      EXPermissionStatusUndetermined
    }

    let status: [String: Any?] = [
      "status": settings.authorizationStatus.rawValue,
      "allowsDisplayInNotificationCenter": notificationSettingToNumber(settings.notificationCenterSetting),
      "allowsDisplayOnLockScreen": notificationSettingToNumber(settings.lockScreenSetting),
      "allowsDisplayInCarPlay": notificationSettingToNumber(settings.carPlaySetting),
      "allowsAlert": notificationSettingToNumber(settings.alertSetting),
      "allowsBadge": notificationSettingToNumber(settings.badgeSetting),
      "allowsSound": notificationSettingToNumber(settings.soundSetting),
      "allowsCriticalAlerts": notificationSettingToNumber(settings.criticalAlertSetting),
      "alertStyle": settings.alertStyle.rawValue,
      "allowsPreviews": showPreviewsSettingToEnum(settings.showPreviewsSetting),
      "providesAppNotificationSettings": settings.providesAppNotificationSettings,
      "allowsAnnouncements": notificationSettingToNumber(settings.announcementSetting)
    ]

    return [
      "status": generalStatus.rawValue,
      "ios": status
    ]
  }

  public func requestPermissions(resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    requestAuthorizationOptions(authorizationOptions, resolver: resolve, rejecter: reject)
  }

  public func requestAuthorizationOptions(_ options: UNAuthorizationOptions, resolver resolve: @escaping EXPromiseResolveBlock, rejecter reject: @escaping EXPromiseRejectBlock) {
    Task {
      do {
        _ = try await UNUserNotificationCenter.current().requestAuthorization(options: options)
        resolve(await getPermissionsAsync())
      } catch {
        reject("ERR_PERMISSIONS_REQUEST_NOTIFICATIONS", error.localizedDescription, error)
      }
    }
  }

  // MARK: - Utilities

  // Converts UNShowPreviewsSetting to IosAllowsPreviews enum values.
  // Native raw values don't match JS enum: never=2, always=0, whenAuthenticated=1
  // Expected JS values: NEVER=0, ALWAYS=1, WHEN_AUTHENTICATED=2
  private func showPreviewsSettingToEnum(_ setting: UNShowPreviewsSetting) -> NSNumber {
    return switch setting {
    case .never: 0
    case .always: 1
    case .whenAuthenticated: 2
    @unknown default: 0
    }
  }

  private func notificationSettingToNumber(_ setting: UNNotificationSetting) -> NSNumber? {
    return switch setting {
    case .enabled: true
    case .disabled: false
    case .notSupported: nil
    @unknown default: nil
    }
  }
}
