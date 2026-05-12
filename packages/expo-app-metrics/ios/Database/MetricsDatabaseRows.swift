// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 A session paired with its child metrics, logs, and (optional) crash report payload — the shape
 dispatch and the JS bridge consume.
 */
struct SessionWithChildren: Sendable {
  let session: SessionRow
  let metrics: [MetricRow]
  let logs: [LogRow]
  let crashReportJSON: String?
}

/**
 Persistence-layer representation of a session row. Mirrors the columns of the `sessions` table
 and is intentionally decoupled from the in-memory `Session` class hierarchy.
 */
public struct SessionRow: Sendable {
  public let id: String
  public let type: String
  public let startTimestamp: String
  public let endTimestamp: String?
  public let isActive: Bool
  public let environment: String?

  public let appName: String?
  public let appIdentifier: String?
  public let appVersion: String?
  public let appBuildNumber: String?
  public let appUpdateId: String?
  public let appUpdateRuntimeVersion: String?
  public let appUpdateRequestHeaders: String?
  public let appEasBuildId: String?

  public let deviceOs: String?
  public let deviceOsVersion: String?
  public let deviceModel: String?
  public let deviceName: String?

  public let expoSdkVersion: String?
  public let reactNativeVersion: String?
  public let clientVersion: String?

  public let languageTag: String?

  public init(
    id: String,
    type: String,
    startTimestamp: String,
    endTimestamp: String? = nil,
    isActive: Bool,
    environment: String? = nil,
    appName: String? = nil,
    appIdentifier: String? = nil,
    appVersion: String? = nil,
    appBuildNumber: String? = nil,
    appUpdateId: String? = nil,
    appUpdateRuntimeVersion: String? = nil,
    appUpdateRequestHeaders: String? = nil,
    appEasBuildId: String? = nil,
    deviceOs: String? = nil,
    deviceOsVersion: String? = nil,
    deviceModel: String? = nil,
    deviceName: String? = nil,
    expoSdkVersion: String? = nil,
    reactNativeVersion: String? = nil,
    clientVersion: String? = nil,
    languageTag: String? = nil
  ) {
    self.id = id
    self.type = type
    self.startTimestamp = startTimestamp
    self.endTimestamp = endTimestamp
    self.isActive = isActive
    self.environment = environment
    self.appName = appName
    self.appIdentifier = appIdentifier
    self.appVersion = appVersion
    self.appBuildNumber = appBuildNumber
    self.appUpdateId = appUpdateId
    self.appUpdateRuntimeVersion = appUpdateRuntimeVersion
    self.appUpdateRequestHeaders = appUpdateRequestHeaders
    self.appEasBuildId = appEasBuildId
    self.deviceOs = deviceOs
    self.deviceOsVersion = deviceOsVersion
    self.deviceModel = deviceModel
    self.deviceName = deviceName
    self.expoSdkVersion = expoSdkVersion
    self.reactNativeVersion = reactNativeVersion
    self.clientVersion = clientVersion
    self.languageTag = languageTag
  }
}

extension SessionRow {
  init(row: SQLiteRow) {
    self.init(
      id: row.string(at: 0) ?? "",
      type: row.string(at: 1) ?? "unknown",
      startTimestamp: row.string(at: 2) ?? "",
      endTimestamp: row.string(at: 3),
      isActive: row.bool(at: 4) ?? false,
      environment: row.string(at: 5),
      appName: row.string(at: 6),
      appIdentifier: row.string(at: 7),
      appVersion: row.string(at: 8),
      appBuildNumber: row.string(at: 9),
      appUpdateId: row.string(at: 10),
      appUpdateRuntimeVersion: row.string(at: 11),
      appUpdateRequestHeaders: row.string(at: 12),
      appEasBuildId: row.string(at: 13),
      deviceOs: row.string(at: 14),
      deviceOsVersion: row.string(at: 15),
      deviceModel: row.string(at: 16),
      deviceName: row.string(at: 17),
      expoSdkVersion: row.string(at: 18),
      reactNativeVersion: row.string(at: 19),
      clientVersion: row.string(at: 20),
      languageTag: row.string(at: 21)
    )
  }
}

/**
 Persistence-layer representation of a metric row. `id` is `nil` for rows that have not yet been
 inserted; assigned by SQLite on insert.
 */
public struct MetricRow: Sendable {
  public let id: Int64?
  public let sessionId: String
  public let timestamp: String
  public let category: String?
  public let name: String
  public let value: Double
  public let routeName: String?
  public let updateId: String?
  /**
   JSON-encoded blob for free-form parameters. The persistence layer doesn't interpret the contents.
   */
  public let params: String?

  public init(
    id: Int64? = nil,
    sessionId: String,
    timestamp: String,
    category: String? = nil,
    name: String,
    value: Double,
    routeName: String? = nil,
    updateId: String? = nil,
    params: String? = nil
  ) {
    self.id = id
    self.sessionId = sessionId
    self.timestamp = timestamp
    self.category = category
    self.name = name
    self.value = value
    self.routeName = routeName
    self.updateId = updateId
    self.params = params
  }
}

extension MetricRow {
  init(row: SQLiteRow) {
    self.init(
      id: row.int64(at: 0),
      sessionId: row.string(at: 1) ?? "",
      timestamp: row.string(at: 2) ?? "",
      category: row.string(at: 3),
      name: row.string(at: 4) ?? "",
      value: row.double(at: 5) ?? 0,
      routeName: row.string(at: 6),
      updateId: row.string(at: 7),
      params: row.string(at: 8)
    )
  }
}

/**
 Persistence-layer representation of a log row.
 */
public struct LogRow: Sendable {
  public let id: Int64?
  public let sessionId: String
  public let timestamp: String
  public let severity: String
  public let name: String
  public let body: String?
  /**
   JSON-encoded attributes blob. The persistence layer doesn't interpret the contents.
   */
  public let attributes: String?
  public let droppedAttributesCount: Int

  public init(
    id: Int64? = nil,
    sessionId: String,
    timestamp: String,
    severity: String,
    name: String,
    body: String? = nil,
    attributes: String? = nil,
    droppedAttributesCount: Int = 0
  ) {
    self.id = id
    self.sessionId = sessionId
    self.timestamp = timestamp
    self.severity = severity
    self.name = name
    self.body = body
    self.attributes = attributes
    self.droppedAttributesCount = droppedAttributesCount
  }
}

extension LogRow {
  init(row: SQLiteRow) {
    self.init(
      id: row.int64(at: 0),
      sessionId: row.string(at: 1) ?? "",
      timestamp: row.string(at: 2) ?? "",
      severity: row.string(at: 3) ?? "info",
      name: row.string(at: 4) ?? "",
      body: row.string(at: 5),
      attributes: row.string(at: 6),
      droppedAttributesCount: row.int(at: 7) ?? 0
    )
  }
}
