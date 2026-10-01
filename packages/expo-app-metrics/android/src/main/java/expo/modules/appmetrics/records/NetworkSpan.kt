package expo.modules.appmetrics.records

/**
 * One completed network request as a root trace span, without the session it belongs to or its
 * trace and span ids. The fields match the stored `Span` row. For expo-observe. Not a stable API.
 */
data class NetworkSpan(
  val name: String,
  val kind: Int,
  // Unix-epoch milliseconds
  val startTimestampMs: Long,
  val endTimestampMs: Long,
  val statusCode: Int?,
  val statusMessage: String?,
  // JSON object
  val attributes: String?,
  // JSON array
  val events: String?
) {
  companion object {
    /** `SpanKind` values from the OTLP proto, for producers picking a `kind`. */
    const val INTERNAL_KIND = 1
    const val CLIENT_KIND = 3

    /** `Status.code` values from the OTLP proto. UNSET is expressed by a null `statusCode`. */
    const val STATUS_ERROR = 2
  }
}
