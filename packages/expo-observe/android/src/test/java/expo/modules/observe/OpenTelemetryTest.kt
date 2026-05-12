package expo.modules.observe

import expo.modules.appmetrics.AppStartupMetric
import expo.modules.appmetrics.MetricCategory
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class OpenTelemetryTest {

  private val testEasClientId = "5c8de5fd-46aa-4084-904a-f62d7e15fcc2"
  private val testSessionId = "b285c8b0-f56b-439a-97c1-64fa30c578bd"

  private val testMetadata = Metadata(
    appName = "Observe",
    appIdentifier = "dev.expo.observe.demo",
    appVersion = "1.0.0",
    appBuildNumber = "1",
    appEasBuildId = null,
    appUpdatesInfo = Metadata.AppUpdatesInfo(
      updateId = "9b3b89b6-2a3f-4d8c-8e2d-2db9f5d1f2a9",
      runtimeVersion = null,
      requestHeaders = null
    ),
    languageTag = "en-US",
    deviceOs = "Android",
    deviceOsVersion = "16",
    deviceModel = "Google sdk_gphone64_arm64",
    deviceName = "emu64a",
    expoSdkVersion = "55.0.0",
    reactNativeVersion = "0.83.1",
    clientVersion = "1.0.0"
  )

  private fun makeMetric(
    name: String,
    value: Double,
    timestamp: String,
    category: String = "appStartup"
  ) = EASMetric(
    sessionId = testSessionId,
    timestamp = timestamp,
    category = category,
    name = name,
    value = value
  )

  private fun makeTestEvent(): Event {
    return Event(
      metadata = testMetadata,
      metrics = listOf(
        makeMetric("loadTime", 8.038, "2026-01-09T12:11:12.072Z"),
        makeMetric("bundleLoadTime", 3.154, "2026-01-09T12:12:26.374Z"),
        makeMetric("timeToFirstRender", 83.221, "2026-01-09T12:12:27.254Z"),
        makeMetric("timeToInteractive", 87.78, "2026-01-09T12:12:31.813Z")
      )
    )
  }

  // -- Metric name mapping --

  private fun nameFor(category: String, name: String): String =
    EASMetric(
      sessionId = testSessionId,
      timestamp = "2026-01-01T00:00:00.000Z",
      category = category,
      name = name,
      value = 1.0
    ).toOTMetric().name

  @Test
  fun `toOTMetric maps every known app startup pair to its OTel name`() {
    val appStartup = MetricCategory.AppStartup.categoryName

    assertEquals("expo.app_startup.tti", nameFor(appStartup, AppStartupMetric.TimeToInteractive.metricName))
    assertEquals("expo.app_startup.ttr", nameFor(appStartup, AppStartupMetric.TimeToFirstRender.metricName))
    assertEquals("expo.app_startup.cold_launch_time", nameFor(appStartup, AppStartupMetric.ColdLaunchTime.metricName))
    assertEquals("expo.app_startup.warm_launch_time", nameFor(appStartup, AppStartupMetric.WarmLaunchTime.metricName))
    assertEquals("expo.app_startup.bundle_load_time", nameFor(appStartup, AppStartupMetric.BundleLoadTime.metricName))
  }

  @Test
  fun `toOTMetric maps legacy app startup names to their OTel names`() {
    val appStartup = MetricCategory.AppStartup.categoryName

    // Legacy names emitted only by older clients — kept in the map for back-compat.
    assertEquals("expo.app_startup.load_time", nameFor(appStartup, "loadTime"))
    assertEquals("expo.app_startup.launch_time", nameFor(appStartup, "launchTime"))
  }

  @Test
  fun `toOTMetric maps the updates download_time pair to its OTel name`() {
    assertEquals(
      "expo.updates.download_time",
      nameFor(MetricCategory.Updates.categoryName, "updateDownloadTime")
    )
  }

  @Test
  fun `toOTMetric maps every known navigation pair to its OTel name`() {
    val navigation = MetricCategory.Navigation.categoryName

    assertEquals("expo.navigation.tti", nameFor(navigation, "tti"))
    assertEquals("expo.navigation.ttr", nameFor(navigation, "ttr"))
  }

  @Test
  fun `toOTMetric falls back to expo_unknown for an unmapped name in a known category`() {
    // Known category, name is not in the map.
    assertEquals(
      "expo.unknown.customMetric",
      nameFor(MetricCategory.AppStartup.categoryName, "customMetric")
    )
  }

  @Test
  fun `toOTMetric falls back to expo_unknown when category mismatches a known name`() {
    // The pair (frameRate, timeToInteractive) is not in the map, so even though
    // `timeToInteractive` is a known metric name under `appStartup`, it falls back.
    assertEquals(
      "expo.unknown.timeToInteractive",
      nameFor(MetricCategory.FrameRate.categoryName, AppStartupMetric.TimeToInteractive.metricName)
    )
  }

  @Test
  fun `toOTMetric falls back to expo_unknown for a fully unknown category and name`() {
    assertEquals("expo.unknown.someValue", nameFor("somethingNew", "someValue"))
  }

  @Test
  fun `toOTMetric falls back to expo_unknown for the updates category with an unmapped name`() {
    // `updates` is in the map only for `updateDownloadTime`; anything else under it falls back.
    assertEquals(
      "expo.unknown.somethingElse",
      nameFor(MetricCategory.Updates.categoryName, "somethingElse")
    )
  }

  fun `navigation metric carries route name and custom params attributes`() {
    val metric = EASMetric(
      sessionId = testSessionId,
      timestamp = "2026-01-01T00:00:00.000Z",
      category = "navigation",
      name = "ttr",
      value = 0.25,
      routeName = "/home",
      customParams = JsonObject(
        mapOf(
          "isInitial" to JsonPrimitive(true),
          "isAppLaunch" to JsonPrimitive(false)
        )
      )
    )
    val attrs = metric.toOTMetric().gauge.dataPoints[0].attributes
      .associate { it.key to it.value.stringValue }

    assertEquals("/home", attrs["expo.route_name"])
    val parsed = Json.parseToJsonElement(attrs["expo.custom_params"]!!).jsonObject
    assertEquals(true, parsed["isInitial"]!!.jsonPrimitive.content.toBoolean())
    assertEquals(false, parsed["isAppLaunch"]!!.jsonPrimitive.content.toBoolean())
  }

  // -- Metric structure --

  @Test
  fun `toOTMetric produces correct structure`() {
    val metric = makeMetric("bundleLoadTime", 3.14, "2026-01-09T12:08:09.000Z")
    val otMetric = metric.toOTMetric()

    assertEquals("s", otMetric.unit)
    assertEquals("expo.app_startup.bundle_load_time", otMetric.name)
    assertEquals(1, otMetric.gauge.dataPoints.size)

    val dataPoint = otMetric.gauge.dataPoints[0]
    assertEquals(3.14, dataPoint.asDouble, 0.001)
    assertEquals(1, dataPoint.attributes.size)
    assertEquals("session.id", dataPoint.attributes[0].key)
    assertEquals(testSessionId, dataPoint.attributes[0].value.stringValue)
  }

  @Test
  fun `toOTMetric converts ISO8601 timestamp to nanoseconds`() {
    // 2026-01-09T12:08:09.000Z = 1767960489000 millis since epoch = 1767960489000000000 nanos
    val metric = makeMetric("loadTime", 1.0, "2026-01-09T12:08:09.000Z")
    val otMetric = metric.toOTMetric()

    val expectedNanos = 1767960489000L * 1_000_000L
    assertEquals(expectedNanos, otMetric.gauge.dataPoints[0].timeUnixNano)
  }

  @Test
  fun `toOTMetric uses sessionId for session id attribute`() {
    val customSessionId = "custom-session-123"
    val metric = EASMetric(
      sessionId = customSessionId,
      timestamp = "2026-01-01T00:00:00.000Z",
      category = "appStartup",
      name = "loadTime",
      value = 1.0
    )
    val otMetric = metric.toOTMetric()
    assertEquals(customSessionId, otMetric.gauge.dataPoints[0].attributes[0].value.stringValue)
  }

  // -- Metric attributes --

  @Test
  fun `toOTMetric includes route name attribute when present`() {
    val metric = EASMetric(
      sessionId = testSessionId,
      timestamp = "2026-01-01T00:00:00.000Z",
      category = "appStartup",
      name = "bundleLoadTime",
      value = 1.0,
      routeName = "/home"
    )
    val otMetric = metric.toOTMetric()
    val attrs = otMetric.gauge.dataPoints[0].attributes.associate { it.key to it.value.stringValue }

    assertEquals("/home", attrs["expo.route_name"])
  }

  @Test
  fun `toOTMetric excludes route name attribute when nil`() {
    val metric = makeMetric("bundleLoadTime", 1.0, "2026-01-01T00:00:00.000Z")
    val otMetric = metric.toOTMetric()
    val keys = otMetric.gauge.dataPoints[0].attributes.map { it.key }

    assertFalse(keys.contains("expo.route_name"))
  }

  @Test
  fun `toOTMetric includes custom params as JSON string`() {
    val metric = EASMetric(
      sessionId = testSessionId,
      timestamp = "2026-01-01T00:00:00.000Z",
      category = "appStartup",
      name = "bundleLoadTime",
      value = 1.0,
      customParams = JsonObject(
        mapOf(
          "screen" to JsonPrimitive("dashboard"),
          "variant" to JsonPrimitive("A")
        )
      )
    )
    val otMetric = metric.toOTMetric()
    val attrs = otMetric.gauge.dataPoints[0].attributes.associate { it.key to it.value.stringValue }

    val parsed = Json.parseToJsonElement(attrs["expo.custom_params"]!!).jsonObject
    assertEquals("dashboard", parsed["screen"]!!.jsonPrimitive.content)
    assertEquals("A", parsed["variant"]!!.jsonPrimitive.content)
  }

  @Test
  fun `toOTMetric includes update id attribute when present`() {
    val metric = EASMetric(
      sessionId = testSessionId,
      timestamp = "2026-01-01T00:00:00.000Z",
      category = "updates",
      name = "updateDownloadTime",
      value = 2.5,
      updateId = "abc123-def456"
    )
    val otMetric = metric.toOTMetric()
    val attrs = otMetric.gauge.dataPoints[0].attributes.associate { it.key to it.value.stringValue }

    assertEquals("expo.updates.download_time", otMetric.name)
    assertEquals("abc123-def456", attrs["expo.update_id"])
    assertEquals(testSessionId, attrs["session.id"])
  }

  @Test
  fun `toOTMetric excludes update id attribute when nil`() {
    val metric = makeMetric("bundleLoadTime", 1.0, "2026-01-01T00:00:00.000Z")
    val otMetric = metric.toOTMetric()
    val keys = otMetric.gauge.dataPoints[0].attributes.map { it.key }

    assertFalse(keys.contains("expo.update_id"))
  }

  @Test
  fun `toOTMetric excludes custom params attribute when nil`() {
    val metric = makeMetric("bundleLoadTime", 1.0, "2026-01-01T00:00:00.000Z")
    val otMetric = metric.toOTMetric()
    val keys = otMetric.gauge.dataPoints[0].attributes.map { it.key }

    assertFalse(keys.contains("expo.custom_params"))
  }

  // -- Event metadata --

  @Test
  fun `toOTMetadata includes all resource attributes`() {
    val event = makeTestEvent()
    val metadata = event.toOTMetadata(testEasClientId)

    val attrs = metadata.attributes.associate { it.key to it.value.stringValue }

    assertEquals("dev.expo.observe.demo", attrs["service.name"])
    assertEquals("1.0.0", attrs["service.version"])
    assertEquals("linux", attrs["os.type"])
    assertEquals("Android", attrs["os.name"])
    assertEquals("16", attrs["os.version"])
    assertEquals("emu64a", attrs["device.model.name"])
    assertEquals("Google sdk_gphone64_arm64", attrs["device.model.identifier"])
    assertEquals("expo-observe", attrs["telemetry.sdk.name"])
    assertEquals("kotlin", attrs["telemetry.sdk.language"])
    assertEquals("Observe", attrs["expo.app.name"])
    assertEquals("1", attrs["expo.app.build_number"])
    // Backward-compat key
    assertEquals("9b3b89b6-2a3f-4d8c-8e2d-2db9f5d1f2a9", attrs["expo.app.update_id"])
    // New key
    assertEquals("9b3b89b6-2a3f-4d8c-8e2d-2db9f5d1f2a9", attrs["expo.app.updates.id"])
    assertEquals("55.0.0", attrs["expo.sdk.version"])
    assertEquals("0.83.1", attrs["expo.react_native.version"])
    assertEquals(testEasClientId, attrs["expo.eas_client.id"])
    assertNull(attrs["expo.eas_build.id"])
  }

  @Test
  fun `toOTMetadata emits update runtime version and channel when present`() {
    val metadata = testMetadata.copy(
      appUpdatesInfo = Metadata.AppUpdatesInfo(
        updateId = "9b3b89b6-2a3f-4d8c-8e2d-2db9f5d1f2a9",
        runtimeVersion = "1.0.0",
        requestHeaders = mapOf(
          "expo-channel-name" to "production",
          "expo-runtime-version" to "1.0.0"
        )
      )
    )
    val event = Event(metadata = metadata, metrics = emptyList())
    val attrs = event.toOTMetadata(testEasClientId).attributes.associate { it.key to it.value.stringValue }

    assertEquals("1.0.0", attrs["expo.app.updates.runtime_version"])
    assertEquals("production", attrs["expo.app.updates.channel"])
  }

  @Test
  fun `toOTMetadata excludes update attributes when appUpdatesInfo is null`() {
    val metadata = testMetadata.copy(appUpdatesInfo = null)
    val event = Event(metadata = metadata, metrics = emptyList())
    val keys = event.toOTMetadata(testEasClientId).attributes.map { it.key }

    assertFalse(keys.contains("expo.app.update_id"))
    assertFalse(keys.contains("expo.app.updates.id"))
    assertFalse(keys.contains("expo.app.updates.runtime_version"))
    assertFalse(keys.contains("expo.app.updates.channel"))
  }

  // -- Full OTEvent --

  @Test
  fun `toOTEvent produces correct structure`() {
    val event = makeTestEvent()
    val otEvent = event.toOTEvent(testEasClientId)

    // Resource should have attributes
    assertTrue(otEvent.resource.attributes.isNotEmpty())

    // Should have one scopeMetrics entry
    assertEquals(1, otEvent.scopeMetrics.size)

    val scopeMetrics = otEvent.scopeMetrics[0]
    assertEquals("expo-observe", scopeMetrics.scope.name)

    // Should have all 4 metrics
    assertEquals(4, scopeMetrics.metrics.size)

    val metricNames = scopeMetrics.metrics.map { it.name }
    assertTrue(metricNames.contains("expo.app_startup.load_time"))
    assertTrue(metricNames.contains("expo.app_startup.bundle_load_time"))
    assertTrue(metricNames.contains("expo.app_startup.ttr"))
    assertTrue(metricNames.contains("expo.app_startup.tti"))
  }

  // -- OTRequestBody --

  @Test
  fun `OTRequestBody wraps events in resourceMetrics`() {
    val event = makeTestEvent()
    val otEvent = event.toOTEvent(testEasClientId)
    val requestBody = OTRequestBody(resourceMetrics = listOf(otEvent))

    assertEquals(1, requestBody.resourceMetrics.size)
    assertEquals(4, requestBody.resourceMetrics[0].scopeMetrics[0].metrics.size)
  }

  @Test
  fun `OTRequestBody serializes to valid JSON`() {
    val event = makeTestEvent()
    val otEvent = event.toOTEvent(testEasClientId)
    val requestBody = OTRequestBody(resourceMetrics = listOf(otEvent))

    val jsonString = requestBody.toJson()
    assertTrue(jsonString.isNotEmpty())

    // Verify it can be round-tripped
    val decoded = Json.decodeFromString<OTRequestBody>(jsonString)
    assertEquals(1, decoded.resourceMetrics.size)
    assertEquals(4, decoded.resourceMetrics[0].scopeMetrics[0].metrics.size)
  }

  @Test
  fun `OTRequestBody JSON has expected top-level structure`() {
    val event = makeTestEvent()
    val otEvent = event.toOTEvent(testEasClientId)
    val requestBody = OTRequestBody(resourceMetrics = listOf(otEvent))

    val jsonString = requestBody.toJson()
    val json = Json.parseToJsonElement(jsonString).jsonObject

    // Top level should have "resourceMetrics" array
    val resourceMetrics = json["resourceMetrics"]!!.jsonArray
    assertEquals(1, resourceMetrics.size)

    // Each entry should have "resource" and "scopeMetrics"
    val entry = resourceMetrics[0].jsonObject
    assertNotNull(entry["resource"])
    assertNotNull(entry["scopeMetrics"])

    // Resource should have "attributes" array
    val resource = entry["resource"]!!.jsonObject
    val attributes = resource["attributes"]!!.jsonArray
    assertTrue(attributes.isNotEmpty())

    // Each attribute should have "key" and "value" with "stringValue"
    val firstAttr = attributes[0].jsonObject
    assertNotNull(firstAttr["key"])
    val attrValue = firstAttr["value"]!!.jsonObject
    assertNotNull(attrValue["stringValue"])
  }

  @Test
  fun `multiple events produce multiple resourceMetrics entries`() {
    val event1 = Event(
      metadata = testMetadata,
      metrics = listOf(makeMetric("bundleLoadTime", 1.0, "2026-01-01T00:00:00.000Z"))
    )
    val event2 = Event(
      metadata = testMetadata,
      metrics = listOf(makeMetric("coldLaunchTime", 2.0, "2026-01-01T00:00:00.000Z"))
    )

    val requestBody = OTRequestBody(
      resourceMetrics = listOf(
        event1.toOTEvent(testEasClientId),
        event2.toOTEvent(testEasClientId)
      )
    )

    assertEquals(2, requestBody.resourceMetrics.size)
    assertEquals("expo.app_startup.bundle_load_time", requestBody.resourceMetrics[0].scopeMetrics[0].metrics[0].name)
    assertEquals("expo.app_startup.cold_launch_time", requestBody.resourceMetrics[1].scopeMetrics[0].metrics[0].name)
  }

  @Test
  fun `OTRequestBody JSON matches server-expected format`() {
    val event = makeTestEvent()
    val otEvent = event.toOTEvent(testEasClientId)
    val requestBody = OTRequestBody(resourceMetrics = listOf(otEvent))

    val jsonString = requestBody.toJson()
    val json = Json.parseToJsonElement(jsonString).jsonObject

    val resourceMetrics = json["resourceMetrics"]!!.jsonArray
    val entry = resourceMetrics[0].jsonObject
    val scopeMetrics = entry["scopeMetrics"]!!.jsonArray
    val scopeEntry = scopeMetrics[0].jsonObject

    // Scope should have name and version
    val scope = scopeEntry["scope"]!!.jsonObject
    assertEquals("expo-observe", scope["name"]!!.jsonPrimitive.content)

    // Metrics should have unit, name, and gauge
    val metrics = scopeEntry["metrics"]!!.jsonArray
    val firstMetric = metrics[0].jsonObject
    assertEquals("s", firstMetric["unit"]!!.jsonPrimitive.content)
    assertNotNull(firstMetric["gauge"])

    // Gauge should have dataPoints
    val gauge = firstMetric["gauge"]!!.jsonObject
    val dataPoints = gauge["dataPoints"]!!.jsonArray
    assertEquals(1, dataPoints.size)

    // DataPoint should have timeUnixNano, value, attributes
    val dp = dataPoints[0].jsonObject
    assertNotNull(dp["timeUnixNano"])
    assertNotNull(dp["asDouble"])
    assertNotNull(dp["attributes"])

    // Session.id attribute should be present
    val dpAttrs = dp["attributes"]!!.jsonArray
    val sessionAttr = dpAttrs[0].jsonObject
    assertEquals("session.id", sessionAttr["key"]!!.jsonPrimitive.content)
    assertEquals(testSessionId, sessionAttr["value"]!!.jsonObject["stringValue"]!!.jsonPrimitive.content)
  }
}

/**
 * Test-only convenience for pulling the inner string out of an [OTAnyValue].
 * Returns `null` for non-string variants — the metric tests in this file only
 * produce string-valued attributes, so a null result is a real assertion
 * failure.
 */
internal val OTAnyValue.stringValue: String?
  get() = (this as? OTAnyValue.Str)?.value

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class LogEventToOTLogRecordTest {
  private fun makeLog(severity: String): LogEvent =
    LogEvent(
      sessionId = "session-1",
      timestamp = "2025-01-01T00:00:00.000Z",
      name = "auth.login_failed",
      body = "invalid_credentials",
      severity = severity,
      attributes = null,
      droppedAttributesCount = 0
    )

  @Test
  fun `renders severityText and severityNumber consistently for known cases`() {
    val warn = makeLog(severity = "warn").toOTLogRecord()
    assertEquals("WARN", warn.severityText)
    assertEquals(13, warn.severityNumber)

    val error = makeLog(severity = "error").toOTLogRecord()
    assertEquals("ERROR", error.severityText)
    assertEquals(17, error.severityNumber)
  }

  @Test
  fun `falls back to INFO consistently for an unknown severity string`() {
    // The previous code uppercased the raw value verbatim while the number
    // path fell back to 9, producing internally-inconsistent records like
    // (severityText="FROBNICATE", severityNumber=9). This pins the fix.
    val ot = makeLog(severity = "frobnicate").toOTLogRecord()
    assertEquals("INFO", ot.severityText)
    assertEquals(9, ot.severityNumber)
  }
}
