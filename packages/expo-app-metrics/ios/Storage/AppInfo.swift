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
  public let updatesInfo: UpdatesInfo?
  public let easBuildId: String?
  public let clientVersion: String
  public let reactNativeVersion: String
  public let expoSdkVersion: String

  public struct UpdatesInfo: Codable, Equatable, Sendable {
    public let updateId: String?
    public let runtimeVersion: String?
    public let requestHeaders: [String: String]?
    public var channel: String? {
      get {
        return requestHeaders?["expo-channel-name"]
      }
    }

    /**
     True when none of the carried fields are populated. Lets callers omit the whole struct from
     wire payloads instead of sending `{ updateId: null, runtimeVersion: null, requestHeaders: null }`,
     matching the pre-SQLite shape where `AppInfo.updatesInfo` was itself optional.
     */
    public var isEmpty: Bool {
      return updateId == nil && runtimeVersion == nil && requestHeaders == nil
    }

    public init(updateId: String?, runtimeVersion: String?, requestHeaders: [String: String]?) {
      self.updateId = updateId
      self.runtimeVersion = runtimeVersion
      self.requestHeaders = requestHeaders
    }
  }

  public init(
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

  public nonisolated(unsafe) static var current: AppInfo = {
    let bundle = Bundle.main
    let infoPlist = bundle.infoDictionary ?? [:]
    let updatesInfo = UpdatesMonitoring.getUpdatesMetricsInfo()

    return AppInfo(
      appId: bundle.bundleIdentifier,
      appName: (infoPlist["CFBundleDisplayName"] ?? infoPlist["CFBundleName"]) as? String,
      appVersion: infoPlist["CFBundleShortVersionString"] as? String,
      buildNumber: infoPlist["CFBundleVersion"] as? String,
      updatesInfo: UpdatesMonitoring.getUpdatesMetricsInfo()
    )
  }()

}
