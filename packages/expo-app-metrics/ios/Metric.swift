// Copyright 2025-present 650 Industries. All rights reserved.

/**
 A struct that represents a single metric which consists of a category, name, value and its creation timestamp.
 Metrics stored in the local storage are of this form.
 */
public struct Metric: Codable, Sendable {
  public enum Category: String, Codable, CaseIterable, Sendable {
    case appStartup
    case frameRate
    case memory
    case session
    case updates
    case navigation
    // TODO(@ubax): support arbitrary user-defined string categories from JS;
    // Until then `JsMetric.toMetric()` drops the category when the raw string 
    // doesn't match a case here.
  }

  public let category: Metric.Category?
  public let name: String
  public let value: Double
  public var timestamp: String = Date.now.ISO8601Format()
  public var routeName: String? = nil
  public var updateId: String? = nil
  public var params: AnyCodable? = nil
  /**
   ID of the session this metric is attached to. `nil` until the metric is handed to a session
   (`Session.receiveMetric`) or hydrated from the database — at every JS-observable read path the
   field is populated, so consumers can rely on it.
   */
  public var sessionId: String? = nil

  init(
    category: Metric.Category?,
    name: String,
    value: Double,
    timestamp: String = Date.now.ISO8601Format(),
    routeName: String? = nil,
    updateId: String? = nil,
    params: [String: Any]? = nil,
    sessionId: String? = nil
  ) {
    self.category = category
    self.name = name
    self.value = value
    self.timestamp = timestamp
    self.routeName = routeName
    self.updateId = updateId
    self.params = params != nil ? AnyCodable(params) : nil
    self.sessionId = sessionId
  }

  func getMetricKey() -> String {
    if let category {
      return "\(category.rawValue).\(name)"
    }
    return name
  }
}
