// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Protocol for objects containing metrics of a specific category.
 */
public protocol Metrics: Codable, Sendable {
  /**
   Type requirement for the `MetricKeys` enum. All keys must have a raw value and the enum must be iterable.
   */
  typealias MetricKey = RawRepresentable & CaseIterable

  /**
   Enum with keys (not raw values) of the object's properties being a metric value.
   */
  associatedtype MetricKeys: MetricKey where MetricKeys.RawValue == String

  /**
   Category of all metrics contained within the object.
   */
  static var category: Metric.Category? { get }

  /**
   Returns an array of metrics contained within the object.
   */
  func toValues() -> [Metric]
}

public extension Metrics {
  // Metrics don't have to be associated with any category (but they should).
  static var category: Metric.Category? {
    return nil
  }

  // The default implementation captures metric values from each property specified in the `MetricKeys` enum.
  func toValues() -> [Metric] {
    let mirror = Mirror(reflecting: self)
    let allCases = Self.MetricKeys.allCases

    return allCases.compactMap { currentCase in
      guard let mirrorChild = mirror.children.first(where: { $0.label == String(describing: currentCase) }) else {
        return nil
      }
      guard let value = mirrorChild.value as? Double else {
        return nil
      }
      return Metric(category: Self.category, name: currentCase.rawValue, value: value)
    }
  }
}
