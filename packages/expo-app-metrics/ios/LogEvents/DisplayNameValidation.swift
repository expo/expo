// Copyright 2025-present 650 Industries. All rights reserved.

/// Max length of a log event display name in characters; overlong values are truncated, not dropped.
private let maxDisplayNameLength = 128

/// Validates and normalizes a caller-provided log event display name.
///
/// Trims surrounding whitespace and returns `nil` for `nil` or blank input so the call site
/// can omit the field entirely. Overlong values are truncated with a warning, preserving the prefix.
func validateDisplayName(_ displayName: String?) -> String? {
  guard let displayName else {
    return nil
  }
  let trimmed = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
  if trimmed.isEmpty {
    return nil
  }
  return truncateToMaxLength(
    trimmed,
    maxLength: maxDisplayNameLength,
    warningMessage:
      "[AppMetrics] logEvent truncated displayName from \(trimmed.count) characters "
      + "to the \(maxDisplayNameLength)-character limit."
  )
}
