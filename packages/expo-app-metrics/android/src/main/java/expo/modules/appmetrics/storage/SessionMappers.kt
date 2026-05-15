package expo.modules.appmetrics.storage

import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.UUID
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

/**
 * JS-facing shape of a metric. Mirrors the TypeScript `Metric` type. The
 * storage-only `sessionId` foreign key is omitted — JS consumers receive
 * metrics either through a session shared object (where the owning session is
 * implicit) or through `getStoredEntries()`, neither of which expose the id on
 * the wire. The id is stamped natively from the receiving session when the
 * record arrives as `Session.addMetric` input.
 */
data class JsMetric(
  @Field val category: String,
  @Field val name: String,
  @Field val value: Double,
  @Field val metricId: String? = null,
  @Field val timestamp: String = TimeUtils.getCurrentTimestampInISOFormat(),
  @Field val routeName: String? = null,
  @Field val updateId: String? = null,
  @Field val params: Map<String, Any?>? = null
) : Record {
  // The persisted `sessionId` is stamped by `SessionManager.addMetrics` at insert
  // time, so we leave it empty here — the JS bridge never carries it on the wire.
  fun toMetric(): Metric =
    Metric(
      metricId = metricId ?: UUID.randomUUID().toString(),
      sessionId = "",
      timestamp = timestamp,
      category = category,
      name = name,
      value = value,
      routeName = routeName,
      updateId = updateId,
      params = params?.let { JsonAny.encodeMapToJsonString(it) }
    )

  companion object {
    fun fromMetric(metric: Metric): JsMetric =
      JsMetric(
        metricId = metric.metricId,
        timestamp = metric.timestamp,
        category = metric.category,
        name = metric.name,
        value = metric.value,
        routeName = metric.routeName,
        updateId = metric.updateId,
        params = decodeJsonObject(metric.params)
      )
  }
}

/**
 * JS-facing shape of a log event. Mirrors the TypeScript `LogRecord` type and
 * decodes the storage-only JSON `attributes` column into a typed map.
 *
 * `logId`, `sessionId`, and `droppedAttributesCount` are storage- and
 * dispatch-side concerns: JS consumers see the record under its parent
 * session (so the parent id is implicit), and the dropped-attribute
 * bookkeeping is only meaningful on the OTel wire payload.
 */
data class JsLogRecord(
  @Field val timestamp: String,
  @Field val name: String,
  @Field val body: String?,
  @Field val severity: String,
  @Field val attributes: Map<String, Any?>?
) : Record {
  companion object {
    fun fromLogRecord(log: LogRecord): JsLogRecord =
      JsLogRecord(
        timestamp = log.timestamp,
        name = log.name,
        body = log.body,
        severity = log.severity,
        attributes = decodeJsonObject(log.attributes)
      )
  }
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
    element.mapValues { (_, v) -> JsonAny.fromElement(v) }
  }.getOrNull()
}
