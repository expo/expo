package expo.modules.appmetrics.sessions

import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
data class JsMetric(
  @Field val sessionId: String,
  @Field val category: String,
  @Field val name: String,
  @Field val value: Double,
  @Field val timestamp: String = TimeUtils.getCurrentTimestampInISOFormat(),
  @Field val routeName: String? = null,
  @Field val updateId: String? = null,
  @Field val params: Map<String, Any?>? = null
) : Record {
  fun toMetric(): MetricRecord =
    MetricRecord(
      timestamp = timestamp,
      category = category,
      name = name,
      value = value,
      routeName = routeName,
      updateId = updateId,
      params = params?.let { JsonAny.encodeMapToJsonString(it) }
    )
}

/**
 * Payload for `Session.addMetric` — mirrors the TypeScript `MetricInput` type
 * (`Metric` minus `sessionId`). The owning session is implied by the shared
 * object the metric is added to, so the session id is not carried across the
 * bridge; `updateId` is a native-side concern not exposed to JS.
 */
@OptimizedRecord
data class SessionMetricInput(
  @Field val category: String,
  @Field val name: String,
  @Field val value: Double,
  @Field val timestamp: String = TimeUtils.getCurrentTimestampInISOFormat(),
  @Field val routeName: String? = null,
  @Field val params: Map<String, Any?>? = null
) : Record {
  fun toMetric(): MetricRecord =
    MetricRecord(
      timestamp = timestamp,
      category = category,
      name = name,
      value = value,
      routeName = routeName,
      updateId = null,
      params = params?.let { JsonAny.encodeMapToJsonString(it) }
    )
}
