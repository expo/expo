// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Persistence-layer representation of a session row. Mirrors the columns of the `sessions` table
 and is intentionally decoupled from the in-memory `Session` class hierarchy.
 */
struct SessionRow: Sendable {
  let id: String
  let type: String
  let startTimestamp: String
  let endTimestamp: String?
  let isActive: Bool
  let environment: String?

  let appName: String?
  let appIdentifier: String?
  let appVersion: String?
  let appBuildNumber: String?
  let appUpdateId: String?
  let appUpdateRuntimeVersion: String?
  let appUpdateRequestHeaders: String?
  let appEasBuildId: String?

  let deviceOs: String?
  let deviceOsVersion: String?
  let deviceModel: String?
  let deviceName: String?

  let expoSdkVersion: String?
  let reactNativeVersion: String?
  let clientVersion: String?

  let languageTag: String?
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
struct MetricRow: Sendable {
  let id: Int64?
  let sessionId: String
  let timestamp: String
  let category: String?
  let name: String
  let value: Double
  let routeName: String?
  let updateId: String?
  /**
   JSON-encoded blob for free-form parameters. The persistence layer doesn't interpret the contents.
   */
  let params: String?
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
struct LogRow: Sendable {
  let id: Int64?
  let sessionId: String
  let timestamp: String
  let severity: String
  let name: String
  let body: String?
  /**
   JSON-encoded attributes blob. The persistence layer doesn't interpret the contents.
   */
  let attributes: String?
  let droppedAttributesCount: Int
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
