package expo.modules.observe

import expo.modules.appmetrics.utils.TimeUtils.timestampToDateNS
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
  val asDouble: Double,
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

  // Updates
  "updateDownloadTime" to "expo.updates.download_time",
)

fun EASMetric.toOTMetric(): OTMetric {
  val attributes = mutableListOf(
    OTAttribute.of(key = "session.id", rawValue = sessionId)
  )
  routeName?.let {
    attributes.add(OTAttribute.of(key = "expo.route_name", rawValue = it))
  }
  updateId?.let {
    attributes.add(OTAttribute.of(key = "expo.update_id", rawValue = it))
  }
  customParams?.let {
    attributes.add(OTAttribute.of(key = "expo.custom_params", rawValue = it.toString()))
  }

  return OTMetric(
    unit = "s",
    name = metricNameMap[name] ?: "expo.app_startup.$name",
    gauge = OTGauge(
      dataPoints = listOf(
        OTDataPoint(
          timeUnixNano = timestampToDateNS(timestamp),
          asDouble = value,
          attributes = attributes
        )
      )
    )
  )
}

fun Event.toOTMetadata(easClientId: String): OTMetadata {
  val attributes = mutableListOf(
    OTAttribute.of("service.name", metadata.appIdentifier),
    OTAttribute.of("os.type", "linux"),
    OTAttribute.of("telemetry.sdk.name", "expo-observe"),
    OTAttribute.of("telemetry.sdk.language", "kotlin"),
    OTAttribute.of("expo.sdk.version", metadata.expoSdkVersion),
    OTAttribute.of("expo.react_native.version", metadata.reactNativeVersion),
    OTAttribute.of("expo.eas_client.id", easClientId),
  )

  // Send optional attributes only if they are set.
  // Their defaults should be defined by the backend.
  metadata.appVersion?.let {
    attributes.add(OTAttribute.of("service.version", it))
  }
  metadata.deviceOs?.let {
    attributes.add(OTAttribute.of("os.name", it))
  }
  metadata.deviceOsVersion?.let {
    attributes.add(OTAttribute.of("os.version", it))
  }
  metadata.deviceName?.let {
    attributes.add(OTAttribute.of("device.model.name", it))
  }
  metadata.deviceModel?.let {
    attributes.add(OTAttribute.of("device.model.identifier", it))
  }
  metadata.languageTag?.let {
    attributes.add(OTAttribute.of("browser.language", it))
  }
  metadata.clientVersion?.let {
    attributes.add(OTAttribute.of("telemetry.sdk.version", it))
  }
  metadata.appName?.let {
    attributes.add(OTAttribute.of("expo.app.name", it))
  }
  metadata.appBuildNumber?.let {
    attributes.add(OTAttribute.of("expo.app.build_number", it))
  }
  metadata.appUpdateId?.let {
    attributes.add(OTAttribute.of("expo.app.update_id", it))
  }
  metadata.environment?.let {
    attributes.add(OTAttribute.of("expo.environment", it))
  }
  metadata.appEasBuildId?.let {
    attributes.add(OTAttribute.of("expo.eas_build.id", it))
  }

  return OTMetadata(attributes = attributes)
}

fun Event.toOTEvent(easClientId: String): OTEvent {
  return OTEvent(
    resource = toOTMetadata(easClientId),
    scopeMetrics = listOf(
      OTScopeMetrics(
        scope = OTScope(name = "expo-observe", version = BuildConfig.EXPO_OBSERVE_VERSION),
        metrics = metrics.map { it.toOTMetric() }
      )
    )
  )
}
