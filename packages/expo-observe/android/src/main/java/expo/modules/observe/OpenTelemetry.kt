package expo.modules.observe

import expo.modules.appmetrics.utils.TimeUtils.timestampToDateNS
import java.util.UUID
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

// MARK: -- Open Telemetry data classes

@Serializable
data class OTStringValue(
  val stringValue: String
)

@Serializable
data class OTAttribute(
  val key: String,
  val value: OTStringValue
) {
  companion object {
    fun of(key: String, rawValue: String) = OTAttribute(
      key = key,
      value = OTStringValue(stringValue = rawValue)
    )
  }
}

@Serializable
data class OTDataPoint(
  val timeUnixNano: Long,
  val value: Double,
  val attributes: List<OTAttribute>
)

@Serializable
data class OTGauge(
  val dataPoints: List<OTDataPoint>
)

@Serializable
data class OTMetric(
  val unit: String,
  val name: String,
  val gauge: OTGauge
)

@Serializable
data class OTMetadata(
  val attributes: List<OTAttribute>
)

@Serializable
data class OTScope(
  val name: String,
  val version: String
)

@Serializable
data class OTScopeMetrics(
  val scope: OTScope,
  val metrics: List<OTMetric>
)

@Serializable
data class OTEvent(
  val resource: OTMetadata,
  val scopeMetrics: List<OTScopeMetrics>
)

// MARK: -- Request body for Open Telemetry events

@Serializable
data class OTRequestBody(
  val resourceMetrics: List<OTEvent>
) {
  fun toJson(prettyPrint: Boolean = false): String {
    val json = Json {
      this.prettyPrint = prettyPrint
    }
    return json.encodeToString(serializer(), this)
  }
}

// This must be kept in sync with the INTERNAL_TO_OTEL map in universe
// https://github.com/expo/universe/blob/main/server/www/src/middleware/easObserveRoutes.ts#L209
private val metricNameMap = mapOf(
  "timeToInteractive" to "expo.app_startup.tti",
  "timeToFirstRender" to "expo.app_startup.ttr",
  "coldLaunchTime" to "expo.app_startup.cold_launch_time",
  "warmLaunchTime" to "expo.app_startup.warm_launch_time",
  "bundleLoadTime" to "expo.app_startup.bundle_load_time",

  // Legacy metrics - will be removed in a future release
  "loadTime" to "expo.app_startup.load_time",
  "launchTime" to "expo.app_startup.launch_time",
)

fun EASMetric.toOTMetric(): OTMetric {
  return OTMetric(
    unit = "s",
    name = metricNameMap[name] ?: "expo.app_startup.$name",
    gauge = OTGauge(
      dataPoints = listOf(
        OTDataPoint(
          timeUnixNano = timestampToDateNS(timestamp),
          value = value,
          attributes = listOf(
            OTAttribute.of(
              key = "session.id",
              rawValue = sessionId
            )
          )
        )
      )
    )
  )
}

fun Event.toOTMetadata(easClientId: String): OTMetadata {
  return OTMetadata(
    attributes = listOf(
      OTAttribute.of("service.name", metadata.appIdentifier),
      OTAttribute.of("service.version", metadata.appVersion ?: ""),
      OTAttribute.of("os.type", "linux"),
      OTAttribute.of("os.name", metadata.deviceOs ?: ""),
      OTAttribute.of("os.version", metadata.deviceOsVersion ?: ""),
      OTAttribute.of("device.model.name", metadata.deviceName ?: ""),
      OTAttribute.of("device.model.identifier", metadata.deviceModel ?: ""),
      OTAttribute.of("telemetry.sdk.name", "expo-observe"),
      OTAttribute.of("telemetry.sdk.version", metadata.clientVersion ?: ""),
      OTAttribute.of("telemetry.sdk.language", "kotlin"),
      OTAttribute.of("expo.app.name", metadata.appName ?: ""),
      OTAttribute.of("expo.app.build_number", metadata.appBuildNumber ?: ""),
      OTAttribute.of("expo.app.update_id", metadata.appUpdateId ?: ""),
      OTAttribute.of("expo.sdk.version", metadata.expoSdkVersion),
      OTAttribute.of("expo.react_native.version", metadata.reactNativeVersion),
      OTAttribute.of("expo.eas_client.id", easClientId)
    )
  )
}

fun Event.toOTEvent(easClientId: String): OTEvent {
  return OTEvent(
    resource = toOTMetadata(easClientId),
    scopeMetrics = listOf(
      OTScopeMetrics(
        scope = OTScope(name = "expo-observe", version = metadata.clientVersion ?: ""),
        metrics = metrics.map { it.toOTMetric() }
      )
    )
  )
}
