package expo.modules.appmetrics.jserrors

import expo.modules.appmetrics.logevents.Severity
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
  @Field val componentStack: String? = null,
  @Field val isFatal: Boolean = false
) : Record {
  /** Builds the `exception` log event for the live path. */
  fun toLogRecord(sessionId: String): LogRecord =
    makeExceptionLogRecord(
      sessionId = sessionId,
      source = source.rawValue,
      type = type,
      message = message,
      stacktrace = stacktrace,
      componentStack = componentStack,
      isFatal = isFatal
    )

  /**
   * Snapshots this report for durable on-disk storage, capturing the session it belongs to and the
   * time it happened, both resolved now since by drain time the main session has rotated.
   *
   * Only fatal errors are persisted, and those come from the global handler, which has no React
   * component stack, so `componentStack` isn't carried through this path.
   */
  fun toPendingError(sessionId: String): PendingErrorStore.PendingError =
    PendingErrorStore.PendingError(
      source = source.rawValue,
      type = type,
      message = message,
      stacktrace = stacktrace,
      sessionId = sessionId,
      timestamp = TimeUtils.getCurrentTimestampInISOFormat()
    )
}

/** How the error was captured. A closed set so the `expo.error.source` attribute stays consistent. */
enum class ErrorSource(val rawValue: String) : Enumerable {
  GLOBAL("global"),
  ERROR_BOUNDARY("errorBoundary")
}

/**
 * Builds the `exception` log event for a fatal error ingested from disk on the next launch, using the
 * session and timestamp captured at fatal time.
 */
fun PendingErrorStore.PendingError.toLogRecord(): LogRecord =
  makeExceptionLogRecord(
    sessionId = sessionId,
    source = source,
    type = type,
    message = message,
    stacktrace = stacktrace,
    componentStack = null,
    isFatal = true,
    timestamp = timestamp
  )

/**
 * Builds an `exception` log event following OpenTelemetry's exception-in-logs convention: the error
 * rides as `exception.*` attributes (the event name is `exception` because this captures errors from a
 * handler, not a specific operation), and `expo.error.*` carries the bits OTel has no field for (the
 * capture source and whether the error was fatal). Fatal errors log at `fatal` severity, the rest at
 * `error`. Shared by the live and ingested-fatal paths so both events keep the same shape.
 *
 * Absent `type`/`stacktrace` are kept as explicit `null` rather than omitted, so every `exception`
 * event carries the same attribute keys. The React component stack only exists for error-boundary
 * captures, so `expo.error.component_stack` is omitted entirely when absent rather than logged as
 * `null` on every event.
 */
private fun makeExceptionLogRecord(
  sessionId: String,
  source: String,
  type: String?,
  message: String,
  stacktrace: String?,
  componentStack: String?,
  isFatal: Boolean,
  timestamp: String = TimeUtils.getCurrentTimestampInISOFormat()
): LogRecord {
  val attributes = buildMap {
    put("expo.error.source", source)
    put("expo.error.is_fatal", isFatal)
    put("exception.type", type)
    put("exception.message", message)
    put("exception.stacktrace", stacktrace)
    if (componentStack != null) {
      put("expo.error.component_stack", componentStack)
    }
  }
  return LogRecord(
    sessionId = sessionId,
    timestamp = timestamp,
    name = "exception",
    severity = (if (isFatal) Severity.FATAL else Severity.ERROR).rawValue,
    attributes = JsonAny.encodeMapToJsonString(attributes)
  )
}
