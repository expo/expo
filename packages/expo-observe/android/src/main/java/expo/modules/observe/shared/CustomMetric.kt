package expo.modules.observe.shared

import android.util.Log
import expo.modules.observe.shared.logevents.RESERVED_EVENT_NAME_PREFIX
import expo.modules.observe.shared.logevents.sanitizeLogEventAttributes
import expo.modules.observe.shared.storage.Metric
import expo.modules.observe.shared.utils.JsonAny
import expo.modules.observe.shared.utils.TimeUtils

/**
 * The OpenTelemetry instrument name syntax: a letter, then up to 254 letters, digits, `_`, `.`,
 * `-` or `/`.
 */
private val METRIC_NAME_PATTERN = Regex("[A-Za-z][A-Za-z0-9_.\\-/]{0,254}")

/** The longest unit that OpenTelemetry allows for an instrument. */
internal const val MAX_METRIC_UNIT_LENGTH = 63

/**
 * Builds the metric of a `recordMetric` call for the session, linked to the span with `traceId`
 * and `spanId` when they are set. Returns `null` and warns when the name or the value is not valid,
 * so the caller drops the metric. A unit that is not valid is dropped with a warning, and the
 * metric is kept.
 */
internal fun customMetric(
  sessionId: String,
  name: String,
  value: Double,
  unit: String?,
  attributes: Map<String, Any?>?,
  traceId: String? = null,
  spanId: String? = null
): Metric? {
  val trimmedName = name.trim()
  if (trimmedName.startsWith(RESERVED_EVENT_NAME_PREFIX)) {
    Log.w(
      TAG,
      "[AppMetrics] The metric `$trimmedName` is not recorded because the `expo.` prefix is " +
        "reserved for metrics the SDK records. Pick a name from your own namespace, like " +
        "'checkout.payment_time'."
    )
    return null
  }
  if (!METRIC_NAME_PATTERN.matches(trimmedName)) {
    Log.w(
      TAG,
      "[AppMetrics] The metric `$trimmedName` is not recorded because its name is not valid. A " +
        "metric name starts with a letter, has only letters, digits, '_', '.', '-' and '/', and " +
        "has at most 255 characters, like 'checkout.payment_time'."
    )
    return null
  }
  if (!value.isFinite()) {
    Log.w(
      TAG,
      "[AppMetrics] The metric `$trimmedName` is not recorded because its value is $value. Pass " +
        "a finite number."
    )
    return null
  }
  val sanitizedAttributes = sanitizeLogEventAttributes(attributes, source = "recordMetric").attributes
  return Metric(
    sessionId = sessionId,
    timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
    category = MetricCategory.Custom.categoryName,
    name = trimmedName,
    value = value,
    params = sanitizedAttributes?.let { JsonAny.encodeMapToJsonString(it) },
    unit = validatedMetricUnit(unit, trimmedName),
    traceId = traceId,
    spanId = spanId
  )
}

/**
 * Returns the unit, or `null` when it is empty or not valid. A unit that is not valid is dropped
 * with a warning.
 */
private fun validatedMetricUnit(unit: String?, metricName: String): String? {
  if (unit.isNullOrEmpty()) {
    return null
  }
  // Printable ASCII without the space, so the length in chars is also the length in bytes.
  if (unit.length > MAX_METRIC_UNIT_LENGTH || unit.any { it <= ' ' || it >= '\u007F' }) {
    Log.w(
      TAG,
      "[AppMetrics] The metric `$metricName` is recorded without a unit because `$unit` is not a " +
        "valid unit. A unit has at most $MAX_METRIC_UNIT_LENGTH ASCII characters and no spaces, " +
        "like 'ms', 'By' or '{item}'."
    )
    return null
  }
  return unit
}
