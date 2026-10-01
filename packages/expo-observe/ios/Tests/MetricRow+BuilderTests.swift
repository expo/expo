import ExpoAppMetrics
import Foundation
import Testing

@testable import ExpoObserve

// See `GlobalAttributesTests` for why this suite is pinned to
// `AppMetricsActor` — same race concern, since these tests also set
// the process-wide `GlobalAttributes` store.
@AppMetricsActor
@Suite("MetricRow+Builder", .serialized)
struct MetricRowBuilderTests {
  init() {
    GlobalAttributes.set(nil)
  }

  @Test
  func `MetricRow_from encodes params`() throws {
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
  func `LogRow_from encodes attributes`() throws {
    let log = LogRecord(name: "ev", attributes: ["userId": "u_42"])
    let row = LogRow.from(log: log, sessionId: "s")
    let attrs = try parseParams(row.attributes)
    #expect(attrs.count == 1)
    #expect(attrs["userId"] as? String == "u_42")
  }

  @Test
  func `builders do not merge global attributes`() {
    GlobalAttributes.set(["subscription_tier": "pro"])
    let metricRow = MetricRow.from(metric: Metric(category: .session, name: "duration", value: 1), sessionId: "s")
    let logRow = LogRow.from(log: LogRecord(name: "ev"), sessionId: "s")
    #expect(metricRow.params == nil)
    #expect(logRow.attributes == nil)
  }

  private func parseParams(_ json: String?) throws -> [String: Any] {
    let raw = try #require(json)
    let data = try #require(raw.data(using: .utf8))
    return try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
  }
}
