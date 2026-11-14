package expo.modules.appmetrics.logevents

import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

const val FEEDBACK_LOG_NAME = "expo.feedback"

/** User feedback from `Observe.reportFeedback`. The JS layer validates it and adds the scale to every rating. */
@OptimizedRecord
data class FeedbackReport(
  @Field val id: String = "",
  @Field val message: String? = null,
  @Field val rating: Long? = null,
  @Field val scaleMin: Long? = null,
  @Field val scaleMax: Long? = null,
  @Field val attributes: Map<String, Any?>? = null
) : Record {
  fun toLogRecord(sessionId: String): LogRecord {
    val sanitized = sanitizeLogEventAttributes(attributes, source = "reportFeedback")
    // Added after sanitization, so caller attributes cannot replace them.
    val attributes = buildMap {
      sanitized.attributes?.let { putAll(it) }
      put("expo.feedback.id", id)
      rating?.let { put("expo.feedback.rating", it) }
      scaleMin?.let { put("expo.feedback.scale.min", it) }
      scaleMax?.let { put("expo.feedback.scale.max", it) }
    }
    return LogRecord(
      sessionId = sessionId,
      timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
      name = FEEDBACK_LOG_NAME,
      body = validateEventBody(message, source = "reportFeedback"),
      severity = Severity.INFO.rawValue,
      attributes = JsonAny.encodeMapToJsonString(attributes),
      droppedAttributesCount = sanitized.droppedCount
    )
  }
}
