// Copyright 2025-present 650 Industries. All rights reserved.

/// The OpenTelemetry instrument name syntax: a letter, then up to 254 letters, digits, `_`, `.`,
/// `-` or `/`. `Regex` isn't Sendable, but this value is never mutated.
nonisolated(unsafe) private let metricNamePattern = /[A-Za-z][A-Za-z0-9_.\-\/]{0,254}/

/// The longest unit that OpenTelemetry allows for an instrument.
let maxMetricUnitLength = 63

/// Builds the metric of a `recordMetric` call, linked to the span with `traceId` and `spanId` when
/// they are set. Returns `nil` and warns when the name or the value is not valid, so the caller
/// drops the metric. A unit that is not valid is dropped with a warning, and the metric is kept.
func customMetric(
  name: String,
  value: Double,
  unit: String?,
  attributes: [String: Any]?,
  traceId: String? = nil,
  spanId: String? = nil
) -> Metric? {
  let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
  guard !trimmedName.hasPrefix(reservedEventNamePrefix) else {
    logger.warn(
      "[AppMetrics] The metric `\(trimmedName)` is not recorded because the `expo.` prefix is reserved for metrics the SDK records. Pick a name from your own namespace, like 'checkout.payment_time'."
    )
    return nil
  }
  guard trimmedName.wholeMatch(of: metricNamePattern) != nil else {
    logger.warn(
      "[AppMetrics] The metric `\(trimmedName)` is not recorded because its name is not valid. A metric name starts with a letter, has only letters, digits, '_', '.', '-' and '/', and has at most 255 characters, like 'checkout.payment_time'."
    )
    return nil
  }
  guard value.isFinite else {
    logger.warn(
      "[AppMetrics] The metric `\(trimmedName)` is not recorded because its value is \(value). Pass a finite number."
    )
    return nil
  }
  return Metric(
    category: .custom,
    name: trimmedName,
    value: value,
    params: sanitizeLogEventAttributes(attributes, source: "recordMetric").attributes,
    unit: validatedMetricUnit(unit, metricName: trimmedName),
    traceId: traceId,
    spanId: spanId
  )
}

/// Returns the unit, or `nil` when it is empty or not valid. A unit that is not valid is dropped
/// with a warning.
private func validatedMetricUnit(_ unit: String?, metricName: String) -> String? {
  guard let unit, !unit.isEmpty else {
    return nil
  }
  // Printable ASCII without the space, so the UTF-8 length is also the character count.
  guard unit.utf8.count <= maxMetricUnitLength, unit.utf8.allSatisfy({ $0 > 0x20 && $0 < 0x7F }) else {
    logger.warn(
      "[AppMetrics] The metric `\(metricName)` is recorded without a unit because `\(unit)` is not a valid unit. A unit has at most \(maxMetricUnitLength) ASCII characters and no spaces, like 'ms', 'By' or '{item}'."
    )
    return nil
  }
  return unit
}
