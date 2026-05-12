// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

extension SessionRow {
  /**
   Builds a `SessionRow` from a `Session`, snapshotting the current `AppInfo`, `DeviceInfo` and
   environment. Called when a new session is inserted; subsequent updates (end timestamp, environment
   patch, OTA app-info patch) are applied with the more focused DAO methods.
   */
  static func snapshot(of session: Session, environment: String?) -> SessionRow {
    let app = AppInfo.current
    let device = DeviceInfo.current
    let updates = app.updatesInfo

    return SessionRow(
      id: session.id,
      type: session.type.rawValue,
      startTimestamp: session.startDate.ISO8601Format(),
      endTimestamp: session.endDate?.ISO8601Format(),
      isActive: session.isActive,
      environment: environment,
      appName: app.appName,
      appIdentifier: app.appId,
      appVersion: app.appVersion,
      appBuildNumber: app.buildNumber,
      appUpdateId: updates?.updateId,
      appUpdateRuntimeVersion: updates?.runtimeVersion,
      appUpdateRequestHeaders: encodeAsJSONString(updates?.requestHeaders),
      appEasBuildId: app.easBuildId,
      deviceOs: device.systemName,
      deviceOsVersion: device.systemVersion,
      deviceModel: device.modelIdentifier,
      deviceName: device.modelName,
      expoSdkVersion: app.expoSdkVersion,
      reactNativeVersion: app.reactNativeVersion,
      clientVersion: app.clientVersion,
      languageTag: Locale.preferredLanguages.first
    )
  }
}
