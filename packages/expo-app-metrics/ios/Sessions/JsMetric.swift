// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// JS-facing shape of a metric attached to a session. The owning session id is
/// stamped natively at the receiving end (`Session.addMetric`) so JS callers
/// don't carry it on the wire.
struct JsMetric: Record {
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
