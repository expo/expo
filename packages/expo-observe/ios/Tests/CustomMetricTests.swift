import Testing

@testable import ExpoObserve

@Suite("Custom metrics")
struct CustomMetricTests {
  @Test
  func `builds a custom metric from valid input`() throws {
    let metric = try #require(
      customMetric(name: " checkout.payment_time ", value: 1.5, unit: "s", attributes: ["method": "card"])
    )
    #expect(metric.category == .custom)
    #expect(metric.name == "checkout.payment_time")
    #expect(metric.value == 1.5)
    #expect(metric.unit == "s")
    let params = try #require(metric.params?.value as? [String: Any])
    #expect(params["method"] as? String == "card")
  }

  @Test
  func `links the metric to a span`() throws {
    let metric = try #require(
      customMetric(
        name: "checkout.items",
        value: 3,
        unit: nil,
        attributes: nil,
        traceId: "a3ce929d0e0e4736a3ce929d0e0e4736",
        spanId: "00f067aa0ba902b7"
      )
    )
    #expect(metric.traceId == "a3ce929d0e0e4736a3ce929d0e0e4736")
    #expect(metric.spanId == "00f067aa0ba902b7")
  }

  @Test
  func `accepts a name of 255 characters`() {
    #expect(customMetric(name: String(repeating: "a", count: 255), value: 1, unit: nil, attributes: nil) != nil)
  }

  @Test(arguments: ["", "1st.metric", "checkout time", "checkout:time", String(repeating: "a", count: 256)])
  func `drops a metric whose name is not valid`(name: String) {
    #expect(customMetric(name: name, value: 1, unit: nil, attributes: nil) == nil)
  }

  @Test
  func `drops a metric in the reserved expo namespace`() {
    #expect(customMetric(name: "expo.app_startup.tti", value: 1, unit: nil, attributes: nil) == nil)
  }

  @Test(arguments: [Double.nan, .infinity, -.infinity])
  func `drops a metric whose value is not finite`(value: Double) {
    #expect(customMetric(name: "checkout.payment_time", value: value, unit: nil, attributes: nil) == nil)
  }

  @Test(arguments: ["", "milli seconds", "µs", String(repeating: "x", count: 64)])
  func `keeps the metric but drops a unit that is empty or not valid`(unit: String) throws {
    let metric = try #require(customMetric(name: "checkout.payment_time", value: 1, unit: unit, attributes: nil))
    #expect(metric.unit == nil)
  }

  @Test
  func `drops reserved attribute keys`() throws {
    let metric = try #require(
      customMetric(name: "checkout.payment_time", value: 1, unit: nil, attributes: ["expo.route": "/", "step": 2])
    )
    let params = try #require(metric.params?.value as? [String: Any])
    #expect(params["expo.route"] == nil)
    #expect(params["step"] as? Int == 2)
  }
}
