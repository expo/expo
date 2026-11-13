package expo.modules.appmetrics.logevents

// Max length of a log event display name in characters; overlong values are truncated, not dropped.
private const val MAX_DISPLAY_NAME_LENGTH = 128

/**
 * Validates and normalizes a caller-provided log event display name.
 *
 * Trims surrounding whitespace and returns `null` for `null` or blank input so the call site
 * can omit the field entirely. Overlong values are truncated with a warning, preserving the prefix.
 */
internal fun validateDisplayName(displayName: String?): String? {
  if (displayName == null) {
    return null
  }
  val trimmed = displayName.trim()
  if (trimmed.isEmpty()) {
    return null
  }
  return truncateToMaxLength(
    trimmed,
    MAX_DISPLAY_NAME_LENGTH,
    "[AppMetrics] logEvent truncated displayName from ${trimmed.length} characters to the $MAX_DISPLAY_NAME_LENGTH-character limit."
  )
}
