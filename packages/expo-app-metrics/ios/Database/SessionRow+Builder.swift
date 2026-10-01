// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

extension SessionRow {
  /// Builds a `SessionRow` for a session that just started. Called when a new session is inserted;
  /// subsequent updates (end timestamp, environment patch, OTA app-info patch) are applied with the
  /// more focused DAO methods.
  static func from(_ session: SessionInfo, environment: String?) -> SessionRow {
    let app = session.app
    let device = session.device
    let updates = app.updatesInfo

    return SessionRow(
      id: session.id,
      type: session.type.rawValue,
      startTimestamp: session.startDate.ISO8601Format(),
      isActive: true,
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
      languageTag: session.languageTag
    )
  }
}
