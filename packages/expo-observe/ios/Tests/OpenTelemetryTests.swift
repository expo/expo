import Testing

@testable import ExpoObserve
@testable import ExpoAppMetrics

@Suite("OpenTelemetry conversion")
struct OpenTelemetryTests {
  // Test event modeled after validEvents.ts
  private let testMetadata = Event.Metadata(
    appName: "Observe",
    appIdentifier: "dev.expo.observe.demo",
    appVersion: "1.0.0",
    appBuildNumber: "1",
    appEasBuildId: nil,
    appUpdatesInfo: AppInfo.UpdatesInfo(
      updateId: "9b3b89b6-2a3f-4d8c-8e2d-2db9f5d1f2a9",
      runtimeVersion: "1.0.0",
      requestHeaders: ["expo-channel-name": "production"]
    ),
    deviceName: "iPhone (Simulator)",
    deviceModel: "iPhone18,1",
    deviceOs: "iOS",
    deviceOsVersion: "26.2",
    reactNativeVersion: "0.83.1",
    expoSdkVersion: "55.0.0",
    clientVersion: "0.0.8",
    languageTag: "en-US",
    environment: nil
  )

  private let testEasClientId = "4127C568-AF7F-46B4-8142-3561A04DE5F7"
  private let testSessionId = "09CED20B-2CD4-4747-A93C-2D62CD9F7DE1"

  private func makeMetric(name: String, value: Double, timestamp: String) -> Event.Metric {
    Event.Metric(
      category: "appStartup",
      name: name,
      value: value,
      timestamp: timestamp,
      sessionId: testSessionId,
      parentSessionId: nil,
      routeName: nil,
      updateId: nil,
      customParams: nil
    )
  }

  private func makeTestEvent() -> Event {
    Event(
      metadata: testMetadata,
      metrics: [
        makeMetric(name: "timeToFirstRender", value: 9.06244065266219, timestamp: "2026-01-09T12:08:09Z"),
        makeMetric(name: "bundleLoadTime", value: 0.29883666667342185, timestamp: "2026-01-09T12:08:09Z"),
        makeMetric(name: "launchTime", value: 5.689726694341516, timestamp: "2026-01-09T12:08:06Z"),
        makeMetric(name: "loadTime", value: 5.2590179443359375, timestamp: "2026-01-09T12:08:05Z"),
      ],
      logs: []
    )
  }

  // MARK: - Metric name mapping

  @Test
  func `known metric names are mapped correctly`() {
    let ttr = makeMetric(name: "timeToFirstRender", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    #expect(ttr.toOTMetric().name == "expo.app_startup.ttr")

    let tti = makeMetric(name: "timeToInteractive", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    #expect(tti.toOTMetric().name == "expo.app_startup.tti")

    let bundle = makeMetric(name: "bundleLoadTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    #expect(bundle.toOTMetric().name == "expo.app_startup.bundle_load_time")

    let cold = makeMetric(name: "coldLaunchTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    #expect(cold.toOTMetric().name == "expo.app_startup.cold_launch_time")

    let warm = makeMetric(name: "warmLaunchTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    #expect(warm.toOTMetric().name == "expo.app_startup.warm_launch_time")

    // Legacy metrics
    let load = makeMetric(name: "loadTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    #expect(load.toOTMetric().name == "expo.app_startup.load_time")

    let launch = makeMetric(name: "launchTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    #expect(launch.toOTMetric().name == "expo.app_startup.launch_time")
  }

  @Test
  func `unknown metric names use fallback pattern`() {
    let custom = makeMetric(name: "customMetric", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    #expect(custom.toOTMetric().name == "expo.unknown.customMetric")
  }

  // MARK: - Metric structure

  @Test
  func `toOTMetric produces correct structure`() {
    let metric = makeMetric(name: "bundleLoadTime", value: 3.14, timestamp: "2026-01-09T12:08:09Z")
    let otMetric = metric.toOTMetric()

    #expect(otMetric.unit == "s")
    #expect(otMetric.name == "expo.app_startup.bundle_load_time")
    #expect(otMetric.gauge.dataPoints.count == 1)

    let dataPoint = otMetric.gauge.dataPoints[0]
    #expect(dataPoint.asDouble == 3.14)
    #expect(dataPoint.attributes.count == 1)
    #expect(dataPoint.attributes[0].key == "session.id")
    #expect(dataPoint.attributes[0].value.stringValue == testSessionId)
  }

  @Test
  func `toOTMetric converts ISO8601 timestamp to nanoseconds`() {
    // 2026-01-09T12:08:09Z = 1767960489 seconds since epoch = 1767960489000000000 nanos
    let metric = makeMetric(name: "loadTime", value: 1.0, timestamp: "2026-01-09T12:08:09Z")
    let otMetric = metric.toOTMetric()

    let expectedNanos: UInt64 = 1767960489 * 1_000_000_000
    #expect(otMetric.gauge.dataPoints[0].timeUnixNano == expectedNanos)
  }

  // MARK: - Event metadata

  @Test
  func `toOTMetadata includes all resource attributes`() {
    let event = makeTestEvent()
    let metadata = event.toOTMetadata(testEasClientId)

    let attrs = Dictionary(uniqueKeysWithValues: metadata.attributes.map { ($0.key, $0.value.stringValue) })

    #expect(attrs["service.version"] == "1.0.0")
    #expect(attrs["os.type"] == "darwin")
    #expect(attrs["os.name"] == "iOS")
    #expect(attrs["os.version"] == "26.2")
    #expect(attrs["device.model.name"] == "iPhone (Simulator)")
    #expect(attrs["device.model.identifier"] == "iPhone18,1")
    #expect(attrs["telemetry.sdk.name"] == "expo-observe")
    #expect(attrs["telemetry.sdk.language"] == "swift")
    #expect(attrs["expo.app.name"] == "Observe")
    #expect(attrs["expo.app.build_number"] == "1")
    // Backward-compat key
    #expect(attrs["expo.app.update_id"] == "9b3b89b6-2a3f-4d8c-8e2d-2db9f5d1f2a9")
    // New keys
    #expect(attrs["expo.app.updates.id"] == "9b3b89b6-2a3f-4d8c-8e2d-2db9f5d1f2a9")
    #expect(attrs["expo.app.updates.runtime_version"] == "1.0.0")
    #expect(attrs["expo.app.updates.channel"] == "production")
    #expect(attrs["expo.sdk.version"] == "55.0.0")
    #expect(attrs["expo.react_native.version"] == "0.83.1")
    #expect(attrs["expo.eas_client.id"] == testEasClientId)
    #expect(attrs["expo.eas_build.id"] == nil)
  }

  @Test
  func `toOTMetadata excludes updates attributes when updatesInfo is nil`() {
    let metadataWithoutUpdates = Event.Metadata(
      appName: "Observe",
      appIdentifier: "dev.expo.observe.demo",
      appVersion: "1.0.0",
      appBuildNumber: "1",
      appEasBuildId: nil,
      appUpdatesInfo: nil,
      deviceName: "iPhone (Simulator)",
      deviceModel: "iPhone18,1",
      deviceOs: "iOS",
      deviceOsVersion: "26.2",
      reactNativeVersion: "0.83.1",
      expoSdkVersion: "55.0.0",
      clientVersion: "0.0.8",
      languageTag: "en-US",
      environment: nil
    )
    let event = Event(metadata: metadataWithoutUpdates, metrics: [], logs: [])
    let metadata = event.toOTMetadata(testEasClientId)
    let keys = metadata.attributes.map { $0.key }

    #expect(keys.contains("expo.app.update_id") == false)
    #expect(keys.contains("expo.app.updates.id") == false)
    #expect(keys.contains("expo.app.updates.runtime_version") == false)
    #expect(keys.contains("expo.app.updates.channel") == false)
  }

  // MARK: - Full OTEvent

  @Test
  func `toOTEvent produces correct structure`() {
    let event = makeTestEvent()
    let otEvent = event.toOTEvent(testEasClientId)

    // Resource should have attributes
    #expect(!otEvent.resource.attributes.isEmpty)

    // Should have one scopeMetrics entry
    #expect(otEvent.scopeMetrics.count == 1)

    let scopeMetrics = otEvent.scopeMetrics[0]
    #expect(scopeMetrics.scope.name == "expo-observe")

    // Should have all 4 metrics
    #expect(scopeMetrics.metrics.count == 4)

    let metricNames = scopeMetrics.metrics.map { $0.name }
    #expect(metricNames.contains("expo.app_startup.ttr"))
    #expect(metricNames.contains("expo.app_startup.bundle_load_time"))
    #expect(metricNames.contains("expo.app_startup.launch_time"))
    #expect(metricNames.contains("expo.app_startup.load_time"))
  }

  // MARK: - OTRequestBody

  @Test
  func `OTRequestBody wraps events in resourceMetrics`() {
    let event = makeTestEvent()
    let otEvent = event.toOTEvent(testEasClientId)
    let requestBody = OTRequestBody(resourceMetrics: [otEvent])

    #expect(requestBody.resourceMetrics.count == 1)
    #expect(requestBody.resourceMetrics[0].scopeMetrics[0].metrics.count == 4)
  }

  @Test
  func `OTRequestBody serializes to valid JSON`() throws {
    let event = makeTestEvent()
    let otEvent = event.toOTEvent(testEasClientId)
    let requestBody = OTRequestBody(resourceMetrics: [otEvent])

    let jsonString = try requestBody.toJSONString()
    #expect(!jsonString.isEmpty)

    // Verify it can be round-tripped
    let data = try requestBody.toJSONData()
    let decoded = try JSONDecoder().decode(OTRequestBody.self, from: data)
    #expect(decoded.resourceMetrics.count == 1)
    #expect(decoded.resourceMetrics[0].scopeMetrics[0].metrics.count == 4)
  }

  @Test
  func `OTRequestBody JSON has expected top-level structure`() throws {
    let event = makeTestEvent()
    let otEvent = event.toOTEvent(testEasClientId)
    let requestBody = OTRequestBody(resourceMetrics: [otEvent])

    let data = try requestBody.toJSONData()
    let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]

    // Top level should have "resourceMetrics" array
    let resourceMetrics = json["resourceMetrics"] as! [[String: Any]]
    #expect(resourceMetrics.count == 1)

    // Each entry should have "resource" and "scopeMetrics"
    let entry = resourceMetrics[0]
    #expect(entry["resource"] != nil)
    #expect(entry["scopeMetrics"] != nil)

    // Resource should have "attributes" array
    let resource = entry["resource"] as! [String: Any]
    let attributes = resource["attributes"] as! [[String: Any]]
    #expect(attributes.count > 0)

    // Each attribute should have "key" and "value" with "stringValue"
    let firstAttr = attributes[0]
    #expect(firstAttr["key"] != nil)
    let attrValue = firstAttr["value"] as! [String: Any]
    #expect(attrValue["stringValue"] != nil)
  }

  // MARK: - Metric attributes

  @Test
  func `toOTMetric includes route name attribute when present`() {
    let metric = Event.Metric(
      category: "appStartup",
      name: "bundleLoadTime",
      value: 1.0,
      timestamp: "2026-01-01T00:00:00Z",
      sessionId: testSessionId,
      parentSessionId: nil,
      routeName: "/home",
      updateId: nil,
      customParams: nil
    )
    let otMetric = metric.toOTMetric()
    let attrs = Dictionary(uniqueKeysWithValues: otMetric.gauge.dataPoints[0].attributes.map { ($0.key, $0.value.stringValue) })

    #expect(attrs["expo.route_name"] == "/home")
  }

  @Test
  func `toOTMetric includes update id attribute when present`() {
    let metric = Event.Metric(
      category: "updates",
      name: "updateDownloadTime",
      value: 2.5,
      timestamp: "2026-01-01T00:00:00Z",
      sessionId: testSessionId,
      parentSessionId: nil,
      routeName: nil,
      updateId: "abc123-def456",
      customParams: nil
    )
    let otMetric = metric.toOTMetric()
    let attrs = Dictionary(uniqueKeysWithValues: otMetric.gauge.dataPoints[0].attributes.map { ($0.key, $0.value.stringValue) })

    #expect(otMetric.name == "expo.updates.download_time")
    #expect(attrs["expo.update_id"] == "abc123-def456")
    #expect(attrs["session.id"] == testSessionId)
  }

  @Test
  func `toOTMetric excludes update id attribute when nil`() {
    let metric = makeMetric(name: "bundleLoadTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    let otMetric = metric.toOTMetric()
    let keys = otMetric.gauge.dataPoints[0].attributes.map { $0.key }

    #expect(keys.contains("expo.update_id") == false)
  }

  @Test
  func `toOTMetric excludes route name attribute when nil`() {
    let metric = makeMetric(name: "bundleLoadTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    let otMetric = metric.toOTMetric()
    let keys = otMetric.gauge.dataPoints[0].attributes.map { $0.key }

    #expect(keys.contains("expo.route_name") == false)
  }

  @Test
  func `toOTMetric includes custom params as JSON string`() throws {
    let metric = Event.Metric(
      category: "appStartup",
      name: "bundleLoadTime",
      value: 1.0,
      timestamp: "2026-01-01T00:00:00Z",
      sessionId: testSessionId,
      parentSessionId: nil,
      routeName: nil,
      updateId: nil,
      customParams: AnyCodable(["screen": "dashboard", "variant": "A"] as [String: Any])
    )
    let otMetric = metric.toOTMetric()
    let attrs = Dictionary(uniqueKeysWithValues: otMetric.gauge.dataPoints[0].attributes.map { ($0.key, $0.value.stringValue) })

    let jsonString = try #require(attrs["expo.custom_params"] ?? nil)
    let parsed = try! JSONSerialization.jsonObject(with: jsonString.data(using: .utf8)!) as! [String: String]
    #expect(parsed["screen"] == "dashboard")
    #expect(parsed["variant"] == "A")
  }

  @Test
  func `toOTMetric excludes custom params attribute when nil`() {
    let metric = makeMetric(name: "bundleLoadTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")
    let otMetric = metric.toOTMetric()
    let keys = otMetric.gauge.dataPoints[0].attributes.map { $0.key }

    #expect(keys.contains("expo.custom_params") == false)
  }

  // MARK: - Multiple events

  @Test
  func `multiple events produce multiple resourceMetrics entries`() {
    let event1 = Event(
      metadata: testMetadata,
      metrics: [makeMetric(name: "bundleLoadTime", value: 1.0, timestamp: "2026-01-01T00:00:00Z")],
      logs: []
    )
    let event2 = Event(
      metadata: testMetadata,
      metrics: [makeMetric(name: "coldLaunchTime", value: 2.0, timestamp: "2026-01-01T00:00:00Z")],
      logs: []
    )

    let requestBody = OTRequestBody(resourceMetrics: [
      event1.toOTEvent(testEasClientId),
      event2.toOTEvent(testEasClientId)
    ])

    #expect(requestBody.resourceMetrics.count == 2)
    #expect(requestBody.resourceMetrics[0].scopeMetrics[0].metrics[0].name == "expo.app_startup.bundle_load_time")
    #expect(requestBody.resourceMetrics[1].scopeMetrics[0].metrics[0].name == "expo.app_startup.cold_launch_time")
  }
}

/**
 Test-only convenience for pulling the inner string out of an `OTAnyValue`.
 Returns `nil` for non-string variants — the metric tests in this file only
 produce string-valued attributes, so a nil result is a real assertion failure.
 */
private extension OTAnyValue {
  var stringValue: String? {
    if case .string(let value) = self {
      return value
    }
    return nil
  }
}
