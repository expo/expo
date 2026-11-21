// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

extension SessionRow {
  /// Builds a `SessionRow` from a `Session`, snapshotting the current `AppInfo`, `DeviceInfo` and
  /// environment. Called when a new session is inserted; subsequent updates (end timestamp, environment
  /// patch, OTA app-info patch) are applied with the more focused DAO methods.
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
      languageTag: Locale.preferredLanguages.first,
      processId: Int(ProcessInfo.processInfo.processIdentifier)
    )
  }

  /// Builds a finished main session for a crashed process that has no stored session, for example a
  /// launch that failed before the app's code ran. The app version, build number and OS version come
  /// from the crash report. The other build details come from the running app only when it is the same
  /// build. The update fields stay empty, because the crashed launch could have run another update.
  static func forCrashedProcess(
    _ crashReport: CrashReport,
    environment: String?,
    app: AppInfo = AppInfo.current,
    device: DeviceInfo = DeviceInfo.current
  ) -> SessionRow {
    let isSameBuild = crashReport.appVersion == app.appVersion && crashReport.appBuildNumber == app.buildNumber
    let crashTimestamp = crashReport.timestampEnd.ISO8601Format()

    return SessionRow(
      id: UUID().uuidString,
      type: Session.SessionType.main.rawValue,
      startTimestamp: crashTimestamp,
      endTimestamp: crashTimestamp,
      isActive: false,
      environment: environment,
      appName: app.appName,
      appIdentifier: app.appId,
      appVersion: crashReport.appVersion,
      appBuildNumber: crashReport.appBuildNumber,
      appEasBuildId: isSameBuild ? app.easBuildId : nil,
      deviceOs: device.systemName,
      deviceOsVersion: crashReport.osVersion.flatMap(versionNumber(from:)) ?? device.systemVersion,
      deviceModel: device.modelIdentifier,
      deviceName: device.modelName,
      expoSdkVersion: isSameBuild ? app.expoSdkVersion : nil,
      reactNativeVersion: isSameBuild ? app.reactNativeVersion : nil,
      clientVersion: app.clientVersion,
      languageTag: Locale.preferredLanguages.first,
      processId: crashReport.processId
    )
  }
}

/// Returns the version number in a MetricKit OS version, for example "17.6.1" for "iPhone OS 17.6.1 (21G93)".
private func versionNumber(from osVersion: String) -> String? {
  let words = osVersion.split(separator: " ")
  return words.first { $0.first?.isNumber == true && $0.contains(".") }.map(String.init)
}
