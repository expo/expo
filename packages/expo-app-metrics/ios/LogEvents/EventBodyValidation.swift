// Copyright 2025-present 650 Industries. All rights reserved.

/// Maximum length of a log event body in characters. Bodies longer than this are
/// truncated rather than dropped, preserving the prefix (most useful for "what
/// happened") and appending an ellipsis suffix so consumers can tell the value
/// was cut. Mirrors the OTel `OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT` default.
private let maxEventBodyLength = 4096

/// Truncates a caller-provided log event body to `maxEventBodyLength` characters,
/// logging a warning when truncation happens. Returns `nil` for `nil` input so
/// the call site can pass the result through unchanged.
func validateEventBody(_ body: String?) -> String? {
  guard let body else {
    return nil
  }
  return truncateToMaxLength(
    body,
    maxLength: maxEventBodyLength,
    warningMessage:
      "[AppMetrics] logEvent truncated body from \(body.count) characters "
      + "to the \(maxEventBodyLength)-character limit."
  )
}
