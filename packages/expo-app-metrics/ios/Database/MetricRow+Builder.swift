// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

extension MetricRow {
  /**
   Builds a `MetricRow` from a `Metric` and the owning session id. The metric's `params` field is
   JSON-encoded into a string column; non-encodable payloads degrade to nil with a logged warning.
   */
  static func from(metric: Metric, sessionId: String) -> MetricRow {
    return MetricRow(
      id: nil,
      sessionId: sessionId,
      timestamp: metric.timestamp,
      category: metric.category?.rawValue,
      name: metric.name,
      value: metric.value,
      routeName: metric.routeName,
      updateId: metric.updateId,
      params: metric.params.flatMap { encodeAsJSONString($0) }
    )
  }
}

extension LogRow {
  static func from(log: LogRecord, sessionId: String) -> LogRow {
    return LogRow(
      id: nil,
      sessionId: sessionId,
      timestamp: log.timestamp,
      severity: log.severity.rawValue,
      name: log.name,
      body: log.body,
      attributes: log.attributes.flatMap { encodeAsJSONString($0) },
      droppedAttributesCount: log.droppedAttributesCount
    )
  }
}

private func encodeAsJSONString(_ value: AnyCodable) -> String? {
  let encoder = JSONEncoder()
  encoder.dateEncodingStrategy = .iso8601
  do {
    let data = try encoder.encode(value)
    return String(data: data, encoding: .utf8)
  } catch {
    logger.warn("[AppMetrics] Failed to JSON-encode params/attributes for storage: \(error.localizedDescription)")
    return nil
  }
}
