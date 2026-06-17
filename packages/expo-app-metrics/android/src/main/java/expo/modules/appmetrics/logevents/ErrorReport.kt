package expo.modules.appmetrics.logevents

import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord

/**
 * An unhandled JavaScript error forwarded from the JS-side `global.ErrorUtils` handler. Recorded as
 * an `exception` log event following OpenTelemetry's exception conventions.
 */
@OptimizedRecord
data class ErrorReport(
  @Field val source: ErrorSource = ErrorSource.GLOBAL,
  @Field val type: String? = null,
  @Field val message: String = "",
  @Field val stacktrace: String? = null,
  @Field val isFatal: Boolean = false
) : Record {
  /**
   * Builds the `exception` log event. Following OpenTelemetry's exception-in-logs convention, the
   * error rides as `exception.*` attributes (the event name is `exception` because this captures
   * errors from a handler, not a specific operation). `expo.error.*` carries the bits OTel has no
   * field for: the capture source and whether the error was fatal. Fatal errors log at `fatal`
   * severity, the rest at `error`.
   */
  fun toLogRecord(sessionId: String): LogRecord {
    // Absent `type`/`stacktrace` are kept as explicit `null` rather than omitted, so the `exception`
    // event always carries the same attribute keys.
    val attributes = mapOf(
      "expo.error.source" to source.rawValue,
      "expo.error.is_fatal" to isFatal,
      "exception.type" to type,
      "exception.message" to message,
      "exception.stacktrace" to stacktrace
    )
    return LogRecord(
      sessionId = sessionId,
      timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
      name = "exception",
      severity = (if (isFatal) Severity.FATAL else Severity.ERROR).rawValue,
      attributes = JsonAny.encodeMapToJsonString(attributes)
    )
  }
}

/** How the error was captured. A closed set so the `expo.error.source` attribute stays consistent. */
enum class ErrorSource(val rawValue: String) : Enumerable {
  GLOBAL("global")
}
