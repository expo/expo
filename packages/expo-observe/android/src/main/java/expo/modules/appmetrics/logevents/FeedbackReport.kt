package expo.modules.appmetrics.logevents

import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils

internal const val FEEDBACK_LOG_NAME = "expo.feedback"

/** User feedback from `Observe.reportFeedback`. The JS layer validates it and adds the scale to every rating. */
internal data class FeedbackReport(
  val id: String = "",
  val message: String? = null,
  val rating: Long? = null,
  val scale: FeedbackScale? = null,
  val attributes: Map<String, Any?>? = null
) {
  fun toLogRecord(sessionId: String): LogRecord {
    val sanitized = sanitizeLogEventAttributes(attributes, source = "reportFeedback")
    // Added after sanitization, so caller attributes cannot replace them.
    val attributes = buildMap {
      sanitized.attributes?.let { putAll(it) }
      put("expo.feedback.id", id)
      rating?.let { put("expo.feedback.rating", it) }
      scale?.let {
        put("expo.feedback.scale.min", it.min)
        put("expo.feedback.scale.max", it.max)
      }
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

internal data class FeedbackScale(
  val min: Long = 0,
  val max: Long = 0
)
