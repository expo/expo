package expo.modules.appmetrics.storage

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.longOrNull

/**
 * Reshapes a [SessionWithMetrics] into the JS-facing `Session` shape. The
 * Room schema uses different field names (`startTimestamp` / `endTimestamp`)
 * and nests the entity under `session`; we flatten and rename here so JS code
 * consumes the same shape it would expect from any other consumer.
 *
 * `type` is hard-coded to `"main"` since the per-launch session opened in
 * `AppMetricsModule.OnCreate` is the only one we track. A future change
 * should add a real `type` column and lifecycle hooks for
 * foreground/screen/custom sessions.
 */
internal fun SessionWithMetrics.toJsSession(): Map<String, Any?> {
  return mapOf(
    "id" to session.id,
    "type" to "main",
    "startDate" to session.startTimestamp,
    "endDate" to session.endTimestamp,
    "metrics" to metrics.map { it.toJsMap() }
  )
}

private fun Metric.toJsMap(): Map<String, Any?> {
  return mapOf(
    "metricId" to metricId,
    "sessionId" to sessionId,
    "timestamp" to timestamp,
    "category" to category,
    "name" to name,
    "value" to value,
    "routeName" to routeName,
    "updateId" to updateId,
    "params" to decodeJsonObject(params)
  )
}

/**
 * Decodes a JSON-encoded object string into a `Map<String, Any?>` whose values
 * are plain Kotlin primitives (`String`, `Long`, `Double`, `Boolean`, `List`,
 * `Map`, or `null`). Returns `null` if the input is `null`/empty or if parsing
 * fails — JS code treats `null` as "no extras".
 */
private fun decodeJsonObject(jsonString: String?): Map<String, Any?>? {
  if (jsonString.isNullOrEmpty()) {
    return null
  }
  return runCatching {
    val element = Json.decodeFromString<JsonElement>(jsonString)
    if (element !is JsonObject) {
      return@runCatching null
    }
    element.mapValues { (_, v) -> jsonElementToAny(v) }
  }.getOrNull()
}

private fun jsonElementToAny(element: JsonElement): Any? {
  return when (element) {
    is JsonNull -> null
    is JsonPrimitive -> when {
      element.isString -> element.content
      else -> element.booleanOrNull
        ?: element.longOrNull
        ?: element.doubleOrNull
        ?: element.content
    }
    is JsonObject -> element.mapValues { (_, v) -> jsonElementToAny(v) }
    is JsonArray -> element.map { jsonElementToAny(it) }
  }
}
