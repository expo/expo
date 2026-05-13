// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Prefix reserved for internal Expo event names. Callers cannot use it so SDK-emitted
 events stay distinguishable from app-emitted ones in the backend.
 */
private let reservedEventNamePrefix = "expo."

/**
 Maximum length of a log event name in characters. Names beyond this length are
 dropped with a warning — most log backends balk on very long names and a runaway
 template literal can easily blow past a few hundred characters by accident.
 */
private let maxEventNameLength = 256

/**
 Validates and normalizes a caller-provided log event name.

 Returns the trimmed name on success, or `nil` when the name should be rejected.
 In the rejection case, a warning is logged explaining why so the developer can
 fix the call site without the app crashing over a telemetry concern.
 */
func validateEventName(_ name: String) -> String? {
  let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
  if trimmedName.isEmpty {
    logger.warn("[AppMetrics] logEvent dropped: event name must not be empty.")
    return nil
  }
  if trimmedName.hasPrefix(reservedEventNamePrefix) {
    logger.warn(
      "[AppMetrics] logEvent dropped: event name `\(trimmedName)` uses the reserved `expo.` prefix."
    )
    return nil
  }
  if trimmedName.count > maxEventNameLength {
    logger.warn(
      "[AppMetrics] logEvent dropped: event name is \(trimmedName.count) characters long, exceeding the \(maxEventNameLength)-character limit."
    )
    return nil
  }
  return trimmedName
}
