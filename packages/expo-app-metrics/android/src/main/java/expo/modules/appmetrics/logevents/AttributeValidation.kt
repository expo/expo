package expo.modules.appmetrics.logevents

import android.util.Log
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.utils.JsonAny
import kotlinx.serialization.json.JsonObject

/**
 * Patterns that match attribute keys reserved by the SDK. Caller-provided
 * attributes whose key matches any of these are dropped:
 *
 * - The `expo.*` namespace, owned entirely by the SDK (e.g. `expo.app.name`,
 *   `expo.eas_client.id`).
 * - Specific OTel Semantic Convention keys the SDK sets on every record
 *   (e.g. `session.id`, `event.name`). Letting callers set these would
 *   produce duplicate-attribute errors on the collector.
 */
private val RESERVED_ATTRIBUTE_PATTERNS: List<Regex> = listOf(
  Regex("^expo\\..+"),
  Regex("^session\\.id$"),
  Regex("^event\\.name$")
)

/**
 * Maximum number of attributes accepted per log record. Mirrors the OTel SDK
 * default (`OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT`) — collectors and backends
 * start to push back well before this limit, so we cap eagerly and surface the
 * overflow via `droppedAttributesCount`.
 *
 * Spec: https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/configuration/sdk-environment-variables.md#logrecord-limits
 */
private const val MAX_ATTRIBUTE_COUNT = 128

/**
 * Result of sanitizing caller-provided log-event attributes.
 *
 * - `attributes`: the attributes that survived validation, or `null` when the
 *   input was `null` or every entry was dropped.
 * - `droppedCount`: number of attributes that were dropped during validation.
 *   Surfaced on the OTel wire as `droppedAttributesCount` so backends know the
 *   record was filtered.
 */
data class SanitizedLogAttributes(
  val attributes: Map<String, Any?>?,
  val droppedCount: Int
)

/**
 * Filters caller-provided log-event attributes. Drops:
 *
 * - keys that are empty after trimming whitespace,
 * - keys under the reserved `expo.*` namespace or matching SDK-set keys,
 * - everything past the per-record attribute count cap.
 *
 * Each rule warns with its own message so the developer can tell at a glance
 * which rule fired.
 */
internal fun sanitizeLogEventAttributes(attributes: Map<String, Any?>?): SanitizedLogAttributes {
  if (attributes == null) {
    return SanitizedLogAttributes(attributes = null, droppedCount = 0)
  }

  val sanitized = mutableMapOf<String, Any?>()
  var emptyKeyDrops = 0
  val reservedKeyDrops = mutableListOf<String>()

  for ((key, value) in attributes) {
    val trimmedKey = key.trim()
    if (trimmedKey.isEmpty()) {
      emptyKeyDrops += 1
      continue
    }
    if (RESERVED_ATTRIBUTE_PATTERNS.any { it.matches(trimmedKey) }) {
      reservedKeyDrops += key
      continue
    }
    sanitized[trimmedKey] = value
  }

  // Apply the per-record cap last so the count reflects every other rule first.
  // Sort by key for a stable choice of which entries survive the cap; otherwise
  // map iteration order would make this nondeterministic. Note this biases
  // retention toward alphabetically-earlier keys when the cap is hit —
  // acceptable for accidental-overflow cases (loop bug, typo); a caller that
  // genuinely needs >128 attributes should split them across multiple events.
  var overflowDrops = 0
  if (sanitized.size > MAX_ATTRIBUTE_COUNT) {
    val droppedKeys = sanitized.keys.sorted().drop(MAX_ATTRIBUTE_COUNT).toSet()
    overflowDrops = droppedKeys.size
    sanitized.keys.removeAll(droppedKeys)
  }

  if (emptyKeyDrops > 0) {
    Log.w(
      TAG,
      "[AppMetrics] logEvent dropped $emptyKeyDrops attribute(s) with empty or whitespace-only keys."
    )
  }
  if (reservedKeyDrops.isNotEmpty()) {
    val formattedKeys = reservedKeyDrops.sorted().joinToString(", ") { "`$it`" }
    Log.w(
      TAG,
      "[AppMetrics] logEvent dropped attributes that overlap SDK-set keys or use the reserved `expo.` namespace: $formattedKeys."
    )
  }
  if (overflowDrops > 0) {
    Log.w(
      TAG,
      "[AppMetrics] logEvent dropped $overflowDrops attribute(s) past the $MAX_ATTRIBUTE_COUNT-attribute per-record cap."
    )
  }

  return SanitizedLogAttributes(
    attributes = if (sanitized.isEmpty()) null else sanitized,
    droppedCount = emptyKeyDrops + reservedKeyDrops.size + overflowDrops
  )
}

/**
 * Converts a sanitized attribute map to a `JsonObject` for storage. Values
 * whose type cannot be represented in OTLP (e.g. `Date`, NaN/Infinity doubles)
 * are encoded as JSON `null` here; the typed-attribute encoder at dispatch
 * time will skip them and add to `droppedAttributesCount` accordingly.
 */
internal fun attributesToJsonObject(attributes: Map<String, Any?>): JsonObject {
  return JsonObject(attributes.mapValues { (_, value) -> JsonAny.toElement(value) })
}
