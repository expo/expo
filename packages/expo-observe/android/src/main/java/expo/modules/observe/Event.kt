package expo.modules.observe

import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.Session
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject

@Serializable
data class Metadata(
  val appName: String?,
  val appIdentifier: String,
  val appVersion: String?,
  val appBuildNumber: String?,
  val appEasBuildId: String?,
  val appUpdatesInfo: AppUpdatesInfo?,
  val languageTag: String?,
  val deviceOs: String?,
  val deviceOsVersion: String?,
  val deviceModel: String?,
  val deviceName: String?,
  val expoSdkVersion: String,
  val reactNativeVersion: String,
  val clientVersion: String?,
  val environment: String? = null
) {
  @Serializable
  data class AppUpdatesInfo(
    val updateId: String?,
    val runtimeVersion: String?,
    val requestHeaders: Map<String, String>?
  ) {
    val channel: String?
      get() = requestHeaders?.get("expo-channel-name")
  }

  companion object {
    fun fromSessionMetadata(session: Session): Metadata {
      val appUpdatesInfo = if (
        session.appUpdateId != null ||
        session.appUpdateRuntimeVersion != null ||
        session.appUpdateRequestHeaders != null
      ) {
        val requestHeaders = session.appUpdateRequestHeaders?.let {
          runCatching {
            Json.decodeFromString(MapSerializer(String.serializer(), String.serializer()), it)
          }.getOrNull()
        }
        AppUpdatesInfo(
          updateId = session.appUpdateId,
          runtimeVersion = session.appUpdateRuntimeVersion,
          requestHeaders = requestHeaders
        )
      } else {
        null
      }
      return Metadata(
        appName = session.appName,
        appIdentifier = session.appIdentifier ?: "",
        appVersion = session.appVersion,
        appBuildNumber = session.appBuildNumber,
        appEasBuildId = session.appEasBuildId,
        appUpdatesInfo = appUpdatesInfo,
        deviceOs = session.deviceOs,
        deviceOsVersion = session.deviceOsVersion,
        deviceModel = session.deviceModel,
        deviceName = session.deviceName,
        expoSdkVersion = session.expoSdkVersion ?: "",
        reactNativeVersion = session.reactNativeVersion ?: "",
        clientVersion = session.clientVersion,
        languageTag = session.languageTag,
        environment = session.environment
      )
    }
  }
}

@Serializable
data class EASMetric(
  val sessionId: String,
  val timestamp: String,
  val category: String,
  val name: String,
  val value: Double,
  val routeName: String? = null,
  val updateId: String? = null,
  val customParams: JsonObject? = null
) {
  companion object {
    fun fromMetric(metric: Metric): EASMetric =
      EASMetric(
        sessionId = metric.sessionId,
        timestamp = metric.timestamp,
        category = metric.category,
        name = metric.name,
        value = metric.value,
        routeName = metric.routeName,
        updateId = metric.updateId,
        // TODO(@lukmccall): Consider using `org.json.JSONObject` instead of kotlinx.serialization. Also, we're not handling exceptions that might be thrown here.
        customParams = metric.params?.let { Json.decodeFromString<JsonObject>(it) }
      )
  }
}

/**
 * Wire shape of a log event ready for dispatch. Distinct from the storage-side
 * `LogRecord`: this form has the JSON `attributes` blob already parsed back
 * into a structured object (so the OTel encoder can map values to typed
 * `OTAnyValue`s) and drops storage-only columns like `logId`.
 */
@Serializable
data class LogEvent(
  val sessionId: String,
  val timestamp: String,
  val name: String,
  val body: String? = null,
  val severity: String,
  val attributes: JsonObject? = null,
  val droppedAttributesCount: Int = 0
) {
  companion object {
    fun fromLogRecord(log: LogRecord): LogEvent =
      LogEvent(
        sessionId = log.sessionId,
        timestamp = log.timestamp,
        name = log.name,
        body = log.body,
        severity = log.severity,
        // Stored as a JSON string; parse defensively, falling back to no
        // attributes if the blob is somehow malformed.
        attributes = log.attributes?.let {
          runCatching { Json.decodeFromString<JsonObject>(it) }.getOrNull()
        },
        droppedAttributesCount = log.droppedAttributesCount
      )
  }
}

@Serializable
data class Event(
  val metadata: Metadata,
  val metrics: List<EASMetric>,
  val logs: List<LogEvent> = emptyList()
)
