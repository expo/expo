// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Public, JSON-friendly snapshot of a persisted session. Built from a `SessionWithChildren` row
 batch and composed from the same domain types (`AppInfo`, `DeviceInfo`, `Metric`, `LogRecord`,
 `CrashReport`) that the rest of the module already exposes — so consumers see one consistent
 vocabulary instead of separate row and domain shapes.
 */
public struct StoredSession: Codable, Sendable {
  public let id: String
  public let type: Session.SessionType
  public let startDate: String
  public let endDate: String?
  public let isActive: Bool
  public let environment: String?
  public let app: AppInfo
  public let device: DeviceInfo
  public let languageTag: String?
  public let metrics: [Metric]
  public let logs: [LogRecord]
  public let crashReport: CrashReport?

  /**
   Projects a row + child batch from the database into the public `StoredSession` shape. JSON-encoded
   blobs (request headers, metric params, log attributes, crash report payload) are decoded back into
   their typed counterparts; rows with malformed blobs degrade gracefully (the offending field becomes
   nil) rather than failing the whole conversion.
   */
  init(from row: SessionWithChildren) {
    let session = row.session
    self.id = session.id
    self.type = Session.SessionType(rawValue: session.type) ?? .unknown
    self.startDate = session.startTimestamp
    self.endDate = session.endTimestamp
    self.isActive = session.isActive
    self.environment = session.environment
    self.languageTag = session.languageTag
    self.app = AppInfo(
      appId: session.appIdentifier,
      appName: session.appName,
      appVersion: session.appVersion,
      buildNumber: session.appBuildNumber,
      updatesInfo: AppInfo.UpdatesInfo(
        updateId: session.appUpdateId,
        runtimeVersion: session.appUpdateRuntimeVersion,
        requestHeaders: decodeJSONDictionary(session.appUpdateRequestHeaders)
      )
    )
    // Device columns are nullable in the schema but always populated when a row is written —
    // `DeviceInfo.current` resolves all four fields synchronously on the main thread. A nil here
    // means the row was inserted from an older build that didn't have the column, in which case
    // an empty string is a reasonable "we don't know" sentinel for the dispatch payload.
    self.device = DeviceInfo(
      modelName: session.deviceName ?? "",
      modelIdentifier: session.deviceModel ?? "",
      systemName: session.deviceOs ?? "",
      systemVersion: session.deviceOsVersion ?? ""
    )
    self.metrics = row.metrics.map { metric in
      return Metric(
        category: metric.category.flatMap { Metric.Category(rawValue: $0) },
        name: metric.name,
        value: metric.value,
        timestamp: metric.timestamp,
        routeName: metric.routeName,
        updateId: metric.updateId,
        params: decodeJSONDictionary(metric.params),
        sessionId: metric.sessionId
      )
    }
    self.logs = row.logs.map { log in
      return LogRecord(
        name: log.name,
        body: log.body,
        attributes: decodeJSONDictionary(log.attributes),
        droppedAttributesCount: log.droppedAttributesCount,
        severity: Severity(rawValue: log.severity) ?? .info,
        timestamp: log.timestamp
      )
    }
    self.crashReport = decodeFromJSONString(CrashReport.self, from: row.crashReportJSON)
  }
}
