package expo.modules.appmetrics.logevents

import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils

/**
 * Validates the event name, truncates the body, sanitizes attributes, and builds a [LogRecord], or
 * returns `null` when the event should be dropped (e.g. an empty or reserved name).
 *
 * Building lives here rather than on the session shared object so the session stays a thin
 * persistence layer (`addLogs` stamps its own id). The returned record carries a blank `sessionId`;
 * the persisting session supplies the real one.
 */
internal fun makeLogRecord(name: String, options: LogEventOptions?): LogRecord? {
  val validatedName = validateEventName(name) ?: return null
  val validatedBody = validateEventBody(options?.body)
  val sanitized = sanitizeLogEventAttributes(options?.attributes)
  val severity = options?.severity ?: Severity.INFO
  return LogRecord(
    sessionId = "",
    timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
    name = validatedName,
    body = validatedBody,
    severity = severity.rawValue,
    attributes = sanitized.attributes?.let { JsonAny.encodeMapToJsonString(it) },
    droppedAttributesCount = sanitized.droppedCount
  )
}
