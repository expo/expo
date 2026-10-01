package expo.modules.appmetrics.storage

import expo.modules.appmetrics.sessions.JsMetric
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

/**
 * JS-facing shape of a historic session — the plain eager `DebugSession` record
 * returned by `getInactiveSessions`. Field names mirror the TypeScript
 * `DebugSession` type (`startDate` / `endDate`), distinct from the Room column
 * names (`startTimestamp` / `endTimestamp`).
 *
 * `type` is hard-coded to `"main"` since the per-launch session opened in
 * `AppMetricsModule.OnCreate` is the only one we track.
 *
 * TODO(@ubax): surface all session types — add a real `type` column and lifecycle
 *   hooks for foreground/screen/custom sessions.
 */
@OptimizedRecord
data class JsDebugSession(
  @Field val id: String,
  @Field val type: String,
  @Field val startDate: String,
  @Field val endDate: String?,
  @Field val metrics: List<JsMetric>,
  @Field val logs: List<JsLogRecord>,
  @Field val crashReport: Map<String, Any?>? = null
) : Record {
  companion object {
    fun fromSessionWithChildren(value: SessionWithChildren): JsDebugSession =
      JsDebugSession(
        id = value.session.id,
        type = "main",
        startDate = value.session.startTimestamp,
        endDate = value.session.endTimestamp,
        metrics = value.metrics.map { it.toJsMetric() },
        logs = value.logs.map { JsLogRecord.fromLogRecord(it) },
        crashReport = decodeJsonObject(value.crashReportPayload)
      )
  }
}

/** Converts a stored `Metric` row to its JS-facing `JsMetric` shape. */
fun Metric.toJsMetric(): JsMetric =
  JsMetric(
    sessionId = sessionId,
    timestamp = timestamp,
    category = category,
    name = name,
    value = value,
    routeName = routeName,
    updateId = updateId,
    params = decodeJsonObject(params)
  )

/**
 * JS-facing shape of a log event. Mirrors the TypeScript `LogRecord` type and
 * decodes the storage-only JSON `attributes` column into a typed map.
 *
 * `sessionId` and `droppedAttributesCount` are storage- and
 * dispatch-side concerns: JS consumers see the record under its parent
 * `Session.logs` (so the parent ID is implicit), and the dropped-attribute
 * bookkeeping is only meaningful on the OTel wire payload.
 */
@OptimizedRecord
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
