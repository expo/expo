package expo.modules.appmetrics.storage

import expo.modules.appmetrics.utils.JsonAny
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

/**
 * JS-facing shape of a session. Field names mirror the TypeScript `Session`
 * type (`startDate` / `endDate`), distinct from the Room column names
 * (`startTimestamp` / `endTimestamp`).
 *
 * `type` is hard-coded to `"main"` since the per-launch session opened in
 * `AppMetricsModule.OnCreate` is the only one we track. A future change
 * should add a real `type` column and lifecycle hooks for
 * foreground/screen/custom sessions.
 */
data class JsSession(
  @Field val id: String,
  @Field val type: String,
  @Field val startDate: String,
  @Field val endDate: String?,
  @Field val metrics: List<JsMetric>,
  @Field val logs: List<JsLogRecord>
) : Record {
  companion object {
    fun fromSessionWithMetrics(value: SessionWithMetrics): JsSession =
      JsSession(
        id = value.session.id,
        type = "main",
        startDate = value.session.startTimestamp,
        endDate = value.session.endTimestamp,
        metrics = value.metrics.map { JsMetric.fromMetric(it) },
        logs = value.logs.map { JsLogRecord.fromLogRecord(it) }
      )
  }
}

data class JsMetric(
  @Field val metricId: String,
  @Field val sessionId: String,
  @Field val timestamp: String,
  @Field val category: String,
  @Field val name: String,
  @Field val value: Double,
  @Field val routeName: String?,
  @Field val updateId: String?,
  @Field val params: Map<String, Any?>?
) : Record {
  companion object {
    fun fromMetric(metric: Metric): JsMetric =
      JsMetric(
        metricId = metric.metricId,
        sessionId = metric.sessionId,
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
 * `Session.logs` (so the parent ID is implicit), and the dropped-attribute
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
