// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 JS-facing shape of a metric attached to a session.
 */
struct JsMetric: Record {
  @Field var sessionId: String = ""
  @Field var category: String = ""
  @Field var name: String = ""
  @Field var value: Double = 0
  @Field var timestamp: String = Date.now.ISO8601Format()
  @Field var routeName: String?
  @Field var updateId: String?
  @Field var params: [String: Any]?

  func toMetric() -> Metric {
    return Metric(
      category: Metric.Category(rawValue: category),
      name: name,
      value: value,
      timestamp: timestamp,
      routeName: routeName,
      updateId: updateId,
      params: params
    )
  }
}
