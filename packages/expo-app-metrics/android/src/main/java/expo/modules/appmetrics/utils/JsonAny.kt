package expo.modules.appmetrics.utils

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.longOrNull

/**
 * Bidirectional converters between caller-supplied `Map<String, Any?>` (typed
 * Kotlin primitives) and `JsonElement` (storage form). The two operations
 * are inverses; keeping them together prevents the encode/decode rules from
 * drifting apart.
 *
 * Decode is best-effort — values whose type cannot be represented in the OTLP
 * `AnyValue` shape (e.g. `Date`, NaN/Infinity doubles) are encoded as JSON
 * `null`, and the dispatch-time encoder folds them into
 * `droppedAttributesCount`.
 */
object JsonAny {
  fun toElement(value: Any?): JsonElement {
    return when (value) {
      null -> JsonNull
      is Boolean -> JsonPrimitive(value)
      is Int -> JsonPrimitive(value)
      is Long -> JsonPrimitive(value)
      is Double -> if (value.isFinite()) JsonPrimitive(value) else JsonNull
      is Float -> if (value.isFinite()) JsonPrimitive(value.toDouble()) else JsonNull
      is Number -> JsonPrimitive(value.toDouble())
      is String -> JsonPrimitive(value)
      is Map<*, *> -> JsonObject(
        value.entries
          .filter { it.key is String }
          .associate { (k, v) -> (k as String) to toElement(v) }
      )
      is List<*> -> JsonArray(value.map { toElement(it) })
      is Array<*> -> JsonArray(value.map { toElement(it) })
      else -> JsonNull
    }
  }

  fun fromElement(element: JsonElement): Any? {
    return when (element) {
      is JsonNull -> null
      is JsonPrimitive -> when {
        element.isString -> element.content
        else -> element.booleanOrNull
          ?: element.longOrNull
          ?: element.doubleOrNull
          ?: element.content
      }
      is JsonObject -> element.mapValues { (_, v) -> fromElement(v) }
      is JsonArray -> element.map { fromElement(it) }
    }
  }
}
