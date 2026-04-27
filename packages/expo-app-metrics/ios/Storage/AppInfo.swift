// Copyright 2025-present 650 Industries. All rights reserved.

import EXUpdatesInterface

/**
 Provides some basic informations about the app.
 */
public struct AppInfo: Codable, Equatable, Sendable {
  public let appId: String?
  public let appName: String?
  public let appVersion: String?
  public let buildNumber: String?
  public let updateId: String?
  public let updateRuntimeVersion: String?
  public let updateChannel: String?
  public let easBuildId: String?
  public let clientVersion: String
  public let reactNativeVersion: String
  public let expoSdkVersion: String

  public init(
    appId: String?,
    appName: String?,
    appVersion: String?,
    buildNumber: String?,
    updateId: String?,
    updateChannel: String?,
    updateRuntimeVersion: String?
  ) {
    self.appId = appId
    self.appName = appName
    self.appVersion = appVersion
    self.buildNumber = buildNumber
    self.updateId = updateId
    self.updateChannel = updateChannel
    self.updateRuntimeVersion = updateRuntimeVersion
    self.easBuildId = AppMetricsVersions.easBuildId
    self.clientVersion = AppMetricsVersions.clientVersion
    self.reactNativeVersion = AppMetricsVersions.reactNativeVersion
    self.expoSdkVersion = AppMetricsVersions.expoSdkVersion
  }

  public nonisolated(unsafe) static var current: AppInfo = {
    let bundle = Bundle.main
    let infoPlist = bundle.infoDictionary ?? [:]

    return AppInfo(
      appId: bundle.bundleIdentifier,
      appName: (infoPlist["CFBundleDisplayName"] ?? infoPlist["CFBundleName"]) as? String,
      appVersion: infoPlist["CFBundleShortVersionString"] as? String,
      buildNumber: infoPlist["CFBundleVersion"] as? String,
      updateId: UpdatesMonitoring.getLaunchedUpdateId(),
      updateChannel: UpdatesMonitoring.getUpdateChannel(),
      updateRuntimeVersion: UpdatesMonitoring.getUpdateRuntimeVersion()
    )
  }()

}
