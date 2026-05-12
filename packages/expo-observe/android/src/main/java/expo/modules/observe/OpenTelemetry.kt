package expo.modules.observe

import expo.modules.appmetrics.AppStartupMetric
import expo.modules.appmetrics.MetricCategory
import expo.modules.appmetrics.logevents.Severity
import expo.modules.appmetrics.utils.TimeUtils.timestampToDateNS
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.longOrNull

// MARK: -- Open Telemetry data classes

/**
 * Wire shape for the OTel `body` field on `LogRecord` — always carries a string.
 * Kept distinct from `OTAnyValue.Str` because the body field on the log record
 * is positional in OTLP (no `stringValue` wrapper key on the value side).
 */
@Serializable
data class OTStringValue(
  val stringValue: String
)

/**
 * Tagged union mirroring the OTLP `AnyValue` shape — encodes as a JSON object
 * with exactly one of `stringValue` / `intValue` / `doubleValue` / `boolValue` /
 * `arrayValue` / `kvlistValue`, depending on the variant.
 *
 * OTLP encodes 64-bit integers as JSON strings to avoid precision loss; we follow
 * that convention so collectors that rely on the protobuf-JSON mapping accept the
 * payload.
 */
@Serializable(with = OTAnyValueSerializer::class)
sealed class OTAnyValue {
  data class Str(val value: String) : OTAnyValue()
  data class Int64(val value: Long) : OTAnyValue()
  data class Dbl(val value: Double) : OTAnyValue()
  data class Bln(val value: Boolean) : OTAnyValue()
  data class Arr(val values: List<OTAnyValue>) : OTAnyValue()
  data class KvList(val values: List<OTKeyValue>) : OTAnyValue()
}

/**
 * Key/value pair used inside `kvlistValue` (and at the top level for span
 * attributes). Same shape as `OTAttribute` but split out for the recursive case.
 */
@Serializable
data class OTKeyValue(
  val key: String,
  val value: OTAnyValue
)

@Serializable
data class OTAttribute(
  val key: String,
  val value: OTAnyValue
) {
  companion object {
    fun of(key: String, rawValue: String) = OTAttribute(
      key = key,
      value = OTAnyValue.Str(rawValue)
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
  val scopeMetrics: List<OTScopeMetrics>,
  val schemaUrl: String
)

@Serializable
data class OTLogRecord(
  val timeUnixNano: Long,
  val observedTimeUnixNano: Long,
  val severityNumber: Int,
  val severityText: String,
  val body: OTStringValue,
  val attributes: List<OTAttribute>,
  val droppedAttributesCount: Int? = null
)

@Serializable
data class OTScopeLogs(
  val scope: OTScope,
  val logRecords: List<OTLogRecord>
)

@Serializable
data class OTResourceLogs(
  val resource: OTMetadata,
  val scopeLogs: List<OTScopeLogs>,
  val schemaUrl: String
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

@Serializable
data class OTLogsRequestBody(
  val resourceLogs: List<OTResourceLogs>
) {
  fun toJson(prettyPrint: Boolean = false): String {
    val json = Json {
      this.prettyPrint = prettyPrint
    }
    return json.encodeToString(serializer(), this)
  }
}

/**
 * OpenTelemetry Semantic Conventions schema URL referenced by the resource on
 * every dispatched payload. Bumping this constant signals that our attribute
 * names follow a newer revision of the conventions.
 *
 * Before bumping, audit the attribute keys we set in `toOTMetadata` and
 * `toOTLogRecord` against the SemConv changelog at
 * https://github.com/open-telemetry/semantic-conventions/blob/main/CHANGELOG.md
 * — a renamed key would silently mismatch the declared schema otherwise.
 */
internal const val SEMCONV_SCHEMA_URL = "https://opentelemetry.io/schemas/1.27.0"

// This must be kept in sync with the INTERNAL_TO_OTEL map in universe
// https://github.com/expo/universe/blob/main/server/www/src/middleware/easObserveRoutes.ts#L209
private val metricNameMap = mapOf(
  // App startup
  (MetricCategory.AppStartup.categoryName to AppStartupMetric.TimeToInteractive.metricName) to "expo.app_startup.tti",
  (MetricCategory.AppStartup.categoryName to AppStartupMetric.TimeToFirstRender.metricName) to "expo.app_startup.ttr",
  (MetricCategory.AppStartup.categoryName to AppStartupMetric.ColdLaunchTime.metricName) to "expo.app_startup.cold_launch_time",
  (MetricCategory.AppStartup.categoryName to AppStartupMetric.WarmLaunchTime.metricName) to "expo.app_startup.warm_launch_time",
  (MetricCategory.AppStartup.categoryName to AppStartupMetric.BundleLoadTime.metricName) to "expo.app_startup.bundle_load_time",

  // Legacy app startup metrics - will be removed in a future release.
  // Not in `AppStartupMetric` since they're emitted by older clients only.
  (MetricCategory.AppStartup.categoryName to "loadTime") to "expo.app_startup.load_time",
  (MetricCategory.AppStartup.categoryName to "launchTime") to "expo.app_startup.launch_time",

  // Updates
  (MetricCategory.Updates.categoryName to "updateDownloadTime") to "expo.updates.download_time",

  // Navigation
  (MetricCategory.Navigation.categoryName to "ttr") to "expo.navigation.ttr",
  (MetricCategory.Navigation.categoryName to "tti") to "expo.navigation.tti"
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
    name = metricNameMap[category to name] ?: "expo.unknown.$name",
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
    OTAttribute.of("expo.eas_client.id", easClientId)
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
  metadata.appUpdatesInfo?.updateId?.let {
    // Fallback for backward compatibility
    attributes.add(OTAttribute.of("expo.app.update_id", it))
    attributes.add(OTAttribute.of("expo.app.updates.id", it))
  }
  metadata.appUpdatesInfo?.channel?.let {
    attributes.add(OTAttribute.of("expo.app.updates.channel", it))
  }
  metadata.appUpdatesInfo?.runtimeVersion?.let {
    attributes.add(OTAttribute.of("expo.app.updates.runtime_version", it))
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
    ),
    schemaUrl = SEMCONV_SCHEMA_URL
  )
}

/**
 * Maps a caller-supplied JSON attribute object (values stored after the JSON
 * roundtrip) to typed `OTAttribute`s. Returns the mapped attributes plus a
 * count of entries that could not be represented (a value type we don't
 * support, or a deeply unrepresentable nested structure) so callers can fold
 * the count into the OTel `droppedAttributesCount`.
 */
internal fun otAttributesFromJsonObject(
  obj: JsonObject
): Pair<List<OTAttribute>, Int> {
  val attributes = mutableListOf<OTAttribute>()
  var droppedCount = 0
  for ((key, element) in obj) {
    val mapped = otAnyValueFromJsonElement(element)
    if (mapped != null) {
      attributes.add(OTAttribute(key = key, value = mapped))
    } else {
      droppedCount += 1
    }
  }
  return attributes to droppedCount
}

/**
 * Converts a `JsonElement` (the storage form of a caller attribute value) into
 * a typed `OTAnyValue`. Returns `null` for `JsonNull` and for any element we
 * cannot represent, so the caller can fold it into `droppedAttributesCount`.
 */
fun LogEvent.toOTLogRecord(): OTLogRecord {
  val attributes = mutableListOf(
    OTAttribute.of(key = "session.id", rawValue = sessionId),
    OTAttribute.of(key = "event.name", rawValue = name)
  )

  var encodeTimeDrops = 0
  this.attributes?.let { attrs ->
    val (typed, dropped) = otAttributesFromJsonObject(attrs)
    attributes.addAll(typed)
    encodeTimeDrops = dropped
  }

  val totalDrops = droppedAttributesCount + encodeTimeDrops
  val timeNs = timestampToDateNS(timestamp)
  // Both `severityNumber` and `severityText` come off the same enum case so
  // they can't disagree. Unknown raw values (e.g. a future case shipped on JS
  // ahead of the native side) fall back to INFO rather than producing an
  // internally-inconsistent OTel record.
  val resolvedSeverity = Severity.fromRawValue(severity) ?: Severity.INFO
  return OTLogRecord(
    timeUnixNano = timeNs,
    observedTimeUnixNano = timeNs,
    severityNumber = resolvedSeverity.severityNumber,
    severityText = resolvedSeverity.severityText,
    body = OTStringValue(stringValue = body ?: ""),
    attributes = attributes,
    droppedAttributesCount = if (totalDrops > 0) totalDrops else null
  )
}

fun Event.toOTResourceLogs(easClientId: String): OTResourceLogs {
  return OTResourceLogs(
    resource = toOTMetadata(easClientId),
    scopeLogs = listOf(
      OTScopeLogs(
        scope = OTScope(name = "expo-observe", version = BuildConfig.EXPO_OBSERVE_VERSION),
        logRecords = logs.map { it.toOTLogRecord() }
      )
    ),
    schemaUrl = SEMCONV_SCHEMA_URL
  )
}

internal fun otAnyValueFromJsonElement(element: JsonElement): OTAnyValue? {
  if (element is kotlinx.serialization.json.JsonNull) {
    return null
  }
  return when (element) {
    is JsonPrimitive -> {
      // Booleans first — JsonPrimitive.booleanOrNull only matches `true`/`false`,
      // not numeric primitives, so order isn't strictly load-bearing, but matching
      // the iOS ordering keeps the ports symmetric.
      element.booleanOrNull?.let { return OTAnyValue.Bln(it) }
      // `isString` distinguishes "42" (string) from 42 (number) since the JSON
      // primitive representation is the same string-of-digits.
      if (element.isString) {
        return OTAnyValue.Str(element.content)
      }
      element.longOrNull?.let { return OTAnyValue.Int64(it) }
      element.doubleOrNull?.let { return if (it.isFinite()) OTAnyValue.Dbl(it) else null }
      null
    }
    is JsonObject -> {
      val pairs = mutableListOf<OTKeyValue>()
      for ((k, v) in element) {
        val mapped = otAnyValueFromJsonElement(v) ?: return null
        pairs.add(OTKeyValue(key = k, value = mapped))
      }
      OTAnyValue.KvList(pairs)
    }
    is kotlinx.serialization.json.JsonArray -> {
      val mapped = element.map { otAnyValueFromJsonElement(it) ?: return null }
      OTAnyValue.Arr(mapped)
    }
  }
}
