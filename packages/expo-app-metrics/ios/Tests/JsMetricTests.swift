import Testing

@testable import ExpoAppMetrics

@Suite("JsMetric → Metric conversion")
struct JsMetricTests {
  @Test
  func `maps known categories to the enum case`() {
    var jsMetric = JsMetric()
    jsMetric.sessionId = "s1"
    jsMetric.category = "navigation"
    jsMetric.name = "ttr"
    jsMetric.value = 1.5
    jsMetric.timestamp = "2026-01-01T00:00:00Z"

    let metric = jsMetric.toMetric()
    #expect(metric.category == .navigation)
    #expect(metric.name == "ttr")
    #expect(metric.value == 1.5)
    #expect(metric.timestamp == "2026-01-01T00:00:00Z")
    #expect(metric.sessionId == "s1")
  }

  @Test
  func `drops the category when the raw string is unknown`() {
    // Until follow-up widens `Metric.Category` to free-form strings,
    // unknown categories are dropped to keep the Codable contract intact.
    var jsMetric = JsMetric()
    jsMetric.sessionId = "s1"
    jsMetric.category = "not-a-real-category"
    jsMetric.name = "custom"
    jsMetric.value = 0

    let metric = jsMetric.toMetric()
    #expect(metric.category == nil)
    #expect(metric.name == "custom")
  }

  @Test
  func `carries routeName, updateId, and params through to the Metric`() {
    var jsMetric = JsMetric()
    jsMetric.sessionId = "s1"
    jsMetric.category = "navigation"
    jsMetric.name = "ttr"
    jsMetric.value = 0.4
    jsMetric.routeName = "/home"
    jsMetric.updateId = "update-1"
    jsMetric.params = ["isInitial": true]

    let metric = jsMetric.toMetric()
    #expect(metric.routeName == "/home")
    #expect(metric.updateId == "update-1")
    #expect(metric.params != nil)
  }
}
