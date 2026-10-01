// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

extension MetricRow {
  /// Builds a `MetricRow` from a `Metric` and the owning session id. The params map is JSON-encoded
  /// into a string column; non-encodable payloads degrade to nil with a logged warning.
  static func from(metric: Metric, sessionId: String) -> MetricRow {
    return MetricRow(
      sessionId: sessionId,
      timestamp: metric.timestamp,
      category: metric.category?.rawValue,
      name: metric.name,
      value: metric.value,
      routeName: metric.routeName,
      updateId: metric.updateId,
      params: (metric.params?.value as? [String: Any]).flatMap { encodeAsJSONString(AnyCodable($0)) }
    )
  }
}

extension LogRow {
  /// Builds a `LogRow` from a `LogRecord` and the owning session id.
  static func from(log: LogRecord, sessionId: String) -> LogRow {
    return LogRow(
      sessionId: sessionId,
      timestamp: log.timestamp,
      severity: log.severity.rawValue,
      name: log.name,
      body: log.body,
      attributes: (log.attributes?.value as? [String: Any]).flatMap { encodeAsJSONString(AnyCodable($0)) },
      droppedAttributesCount: log.droppedAttributesCount
    )
  }
}
