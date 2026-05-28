// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

extension MetricRow {
  /**
   Builds a `MetricRow` from a `Metric` and the owning session id. Caller-set global attributes
   (`GlobalAttributes.set`) are merged into the metric's `params` here so every metric source —
   internal SDK metrics, JS-injected metrics, and the session-stop duration write — picks up
   the same enrichment. Per-metric keys win over globals on collision. The merged map is
   JSON-encoded into a string column; non-encodable payloads degrade to nil with a logged
   warning.
   */
  static func from(metric: Metric, sessionId: String) -> MetricRow {
    let mergedParams = GlobalAttributes.merged(with: metric.params?.value as? [String: Any])
    return MetricRow(
      sessionId: sessionId,
      timestamp: metric.timestamp,
      category: metric.category?.rawValue,
      name: metric.name,
      value: metric.value,
      routeName: metric.routeName,
      updateId: metric.updateId,
      params: mergedParams.flatMap { encodeAsJSONString(AnyCodable($0)) }
    )
  }
}

extension LogRow {
  /**
   Builds a `LogRow` from a `LogRecord` and the owning session id. Caller-set global attributes
   (`GlobalAttributes.set`) are merged into the log's `attributes` here so every log event picks
   up the same enrichment. Per-event keys win over globals on collision.
   */
  static func from(log: LogRecord, sessionId: String) -> LogRow {
    let mergedAttributes = GlobalAttributes.merged(with: log.attributes?.value as? [String: Any])
    return LogRow(
      sessionId: sessionId,
      timestamp: log.timestamp,
      severity: log.severity.rawValue,
      name: log.name,
      body: log.body,
      attributes: mergedAttributes.flatMap { encodeAsJSONString(AnyCodable($0)) },
      droppedAttributesCount: log.droppedAttributesCount
    )
  }
}
