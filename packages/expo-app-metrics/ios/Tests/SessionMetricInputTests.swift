import Testing

@testable import ExpoAppMetrics

@Suite("SessionMetricInput")
struct SessionMetricInputTests {
  @Test
  func `maps known categories and scalar fields to the Metric`() {
    var input = SessionMetricInput()
    input.category = "navigation"
    input.name = "ttr"
    input.value = 1.5
    input.timestamp = "2026-01-01T00:00:00Z"

    let metric = input.toMetric()
    #expect(metric.category == .navigation)
    #expect(metric.name == "ttr")
    #expect(metric.value == 1.5)
    #expect(metric.timestamp == "2026-01-01T00:00:00Z")
  }

  @Test
  func `drops the category when the raw string is unknown`() {
    // Until `Metric.Category` accepts free-form strings, an unknown
    // category is dropped to keep the Codable contract intact.
    var input = SessionMetricInput()
    input.category = "not-a-real-category"
    input.name = "custom"
    input.value = 0

    let metric = input.toMetric()
    #expect(metric.category == nil)
    #expect(metric.name == "custom")
  }

  @Test
  func `carries routeName and params through to the Metric`() {
    var input = SessionMetricInput()
    input.category = "navigation"
    input.name = "ttr"
    input.value = 0.4
    input.routeName = "/home"
    input.params = ["isInitial": true]

    let metric = input.toMetric()
    #expect(metric.routeName == "/home")
    // `updateId` is not part of the JS-facing `MetricInput` contract.
    #expect(metric.updateId == nil)
    #expect(metric.params != nil)
  }
}
