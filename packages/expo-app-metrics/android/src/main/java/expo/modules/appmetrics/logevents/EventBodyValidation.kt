package expo.modules.appmetrics.logevents

/**
 * Maximum length of a log event body, measured in UTF-16 code units (Kotlin
 * `String.length`). Bodies longer than this are truncated rather than dropped,
 * preserving the prefix (most useful for "what happened") and appending an
 * ellipsis suffix so consumers can tell the value was cut.
 *
 * The OTel spec leaves the equivalent log-record body limit unset by default
 * (https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/configuration/sdk-environment-variables.md#logrecord-limits);
 * 4096 is our own cap, chosen to match the SDK's default
 * `OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT` for symmetry with attribute values.
 */
private const val MAX_EVENT_BODY_LENGTH = 4096

/**
 * Truncates a caller-provided log event body to `MAX_EVENT_BODY_LENGTH` characters,
 * logging a warning when truncation happens. Returns `null` for `null` input so
 * the call site can pass the result through unchanged.
 */
internal fun validateEventBody(body: String?): String? {
  if (body == null) {
    return null
  }
  return truncateToMaxLength(
    body,
    MAX_EVENT_BODY_LENGTH,
    "[AppMetrics] logEvent truncated body from ${body.length} characters to the $MAX_EVENT_BODY_LENGTH-character limit."
  )
}
