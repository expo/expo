import Foundation
import Testing

@testable import ExpoAppMetrics

// See `GlobalAttributesTests` for why this suite is pinned to
// `AppMetricsActor` — same race concern, since these tests also exercise
// the process-wide `GlobalAttributes` store via the row builders.
@AppMetricsActor
@Suite("MetricRow+Builder", .serialized)
struct MetricRowBuilderTests {
  init() {
    GlobalAttributes.set(nil)
  }

  @Test
  func `MetricRow_from passes params through when global attributes are empty`() throws {
    let metric = Metric(
      category: .navigation,
      name: "test",
      value: 1,
      params: ["screen": "home"]
    )
    let row = MetricRow.from(metric: metric, sessionId: "s")
    let params = try parseParams(row.params)
    #expect(params.count == 1)
    #expect(params["screen"] as? String == "home")
  }

  @Test
  func `MetricRow_from merges global attributes into params`() throws {
    GlobalAttributes.set(["subscription_tier": "pro", "experiment_variant": "B"])
    let metric = Metric(
      category: .navigation,
      name: "test",
      value: 1,
      params: ["screen": "home"]
    )
    let row = MetricRow.from(metric: metric, sessionId: "s")
    let params = try parseParams(row.params)
    #expect(params.count == 3)
    #expect(params["screen"] as? String == "home")
    #expect(params["subscription_tier"] as? String == "pro")
    #expect(params["experiment_variant"] as? String == "B")
  }

  @Test
  func `MetricRow_from per-metric params win on key collision`() throws {
    GlobalAttributes.set(["screen": "global_default"])
    let metric = Metric(
      category: .navigation,
      name: "test",
      value: 1,
      params: ["screen": "checkout"]
    )
    let row = MetricRow.from(metric: metric, sessionId: "s")
    let params = try parseParams(row.params)
    #expect(params.count == 1)
    #expect(params["screen"] as? String == "checkout")
  }

  @Test
  func `MetricRow_from writes global attributes into a metric without its own params`() throws {
    GlobalAttributes.set(["subscription_tier": "pro"])
    let metric = Metric(category: .session, name: "duration", value: 12.5)
    let row = MetricRow.from(metric: metric, sessionId: "s")
    let params = try parseParams(row.params)
    #expect(params.count == 1)
    #expect(params["subscription_tier"] as? String == "pro")
  }

  @Test
  func `LogRow_from merges global attributes into attributes`() throws {
    GlobalAttributes.set(["subscription_tier": "pro"])
    let log = LogRecord(name: "ev", attributes: ["userId": "u_42"])
    let row = LogRow.from(log: log, sessionId: "s")
    let attrs = try parseParams(row.attributes)
    #expect(attrs.count == 2)
    #expect(attrs["userId"] as? String == "u_42")
    #expect(attrs["subscription_tier"] as? String == "pro")
  }

  @Test
  func `LogRow_from per-event attributes win on key collision`() throws {
    GlobalAttributes.set(["screen": "global"])
    let log = LogRecord(name: "ev", attributes: ["screen": "checkout"])
    let row = LogRow.from(log: log, sessionId: "s")
    let attrs = try parseParams(row.attributes)
    #expect(attrs.count == 1)
    #expect(attrs["screen"] as? String == "checkout")
  }

  @Test
  func `LogRow_from writes global attributes into a log without attributes`() throws {
    GlobalAttributes.set(["subscription_tier": "pro"])
    let log = LogRecord(name: "ev")
    let row = LogRow.from(log: log, sessionId: "s")
    let attrs = try parseParams(row.attributes)
    #expect(attrs.count == 1)
    #expect(attrs["subscription_tier"] as? String == "pro")
  }

  private func parseParams(_ json: String?) throws -> [String: Any] {
    let raw = try #require(json)
    let data = try #require(raw.data(using: .utf8))
    return try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
  }
}
