package expo.modules.observe

import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.Session
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject

@Serializable
data class Metadata(
  val appName: String?,
  val appIdentifier: String,
  val appVersion: String?,
  val appBuildNumber: String?,
  val appUpdateId: String?,
  val appEasBuildId: String?,
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
  companion object {
    fun fromSessionMetadata(session: Session): Metadata =
      Metadata(
        appName = session.appName,
        appIdentifier = session.appIdentifier ?: "",
        appVersion = session.appVersion,
        appBuildNumber = session.appBuildNumber,
        appUpdateId = session.appUpdateId,
        appEasBuildId = session.appEasBuildId,
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

@Serializable
data class Event(
  val metadata: Metadata,
  val metrics: List<EASMetric>
)
