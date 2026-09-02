// Copyright 2025-present 650 Industries. All rights reserved.

/// Single-character ellipsis appended to a truncated value, kept short so the
/// prefix stays close to the original length budget.
private let truncationSuffix = "…"

/// Truncates `value` to `maxLength` characters, appending the ellipsis suffix and logging
/// `warningMessage` (when given) only if truncation actually happens. Returns `value`
/// unchanged when it already fits.
func truncateToMaxLength(_ value: String, maxLength: Int, warningMessage: String? = nil) -> String {
  if value.count <= maxLength {
    return value
  }
  if let warningMessage {
    logger.warn(warningMessage)
  }
  return String(value.prefix(maxLength - truncationSuffix.count) + truncationSuffix)
}
