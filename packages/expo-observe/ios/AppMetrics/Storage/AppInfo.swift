// Copyright 2025-present 650 Industries. All rights reserved.

import EXUpdatesInterface

/// Provides some basic information about the app.
struct AppInfo: Codable, Equatable, Sendable {
  let appId: String?
  let appName: String?
  let appVersion: String?
  let buildNumber: String?
  let updatesInfo: UpdatesInfo?
  let easBuildId: String?
  let clientVersion: String
  let reactNativeVersion: String
  let expoSdkVersion: String

  struct UpdatesInfo: Codable, Equatable, Sendable {
    let updateId: String?
    let runtimeVersion: String?
    let requestHeaders: [String: String]?
    var channel: String? {
      return requestHeaders?["expo-channel-name"]
    }

    /// True when none of the carried fields are populated. Lets callers omit the whole struct from
    /// wire payloads instead of sending `{ updateId: null, runtimeVersion: null, requestHeaders: null }`,
    /// matching the pre-SQLite shape where `AppInfo.updatesInfo` was itself optional.
    var isEmpty: Bool {
      return updateId == nil && runtimeVersion == nil && requestHeaders == nil
    }

    init(updateId: String?, runtimeVersion: String?, requestHeaders: [String: String]?) {
      self.updateId = updateId
      self.runtimeVersion = runtimeVersion
      self.requestHeaders = requestHeaders
    }
  }

  init(
    appId: String?,
    appName: String?,
    appVersion: String?,
    buildNumber: String?,
    updatesInfo: UpdatesInfo?,
  ) {
    self.appId = appId
    self.appName = appName
    self.appVersion = appVersion
    self.buildNumber = buildNumber
    self.updatesInfo = updatesInfo
    self.easBuildId = AppMetricsVersions.easBuildId
    self.clientVersion = AppMetricsVersions.clientVersion
    self.reactNativeVersion = AppMetricsVersions.reactNativeVersion
    self.expoSdkVersion = AppMetricsVersions.expoSdkVersion
  }

  nonisolated(unsafe) static var current: AppInfo = {
    let bundle = Bundle.main
    let infoPlist = bundle.infoDictionary ?? [:]
    return AppInfo(
      appId: bundle.bundleIdentifier,
      appName: (infoPlist["CFBundleDisplayName"] ?? infoPlist["CFBundleName"]) as? String,
      appVersion: infoPlist["CFBundleShortVersionString"] as? String,
      buildNumber: infoPlist["CFBundleVersion"] as? String,
      updatesInfo: UpdatesMonitoring.getUpdatesMetricsInfo()
    )
  }()

}
