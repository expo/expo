import Testing

@testable import ExpoAppMetrics

// Pinned to `AppMetricsActor` so tests in this suite (and the sibling
// `MetricRow+Builder` suite, which also touches `GlobalAttributes`) can't
// run concurrently and race on the process-wide store. Swift Testing
// parallelizes by default, and the store's per-operation `Mutex` only
// makes individual ops atomic — it can't keep one test's `set/read`
// sequence from being interleaved by another test's `set`.
@AppMetricsActor
@Suite("GlobalAttributes", .serialized)
struct GlobalAttributesTests {
  init() {
    GlobalAttributes.set(nil)
  }

  @Test
  func `merged returns event attributes when store is empty`() {
    let merged = GlobalAttributes.merged(with: ["userId": "u_42"])
    let attributes = try! #require(merged)
    #expect(attributes.count == 1)
    #expect(attributes["userId"] as? String == "u_42")
  }

  @Test
  func `merged returns nil when both store and event attributes are empty`() {
    GlobalAttributes.set(nil)
    #expect(GlobalAttributes.merged(with: nil) == nil)
  }

  @Test
  func `set populates the store and merged returns globals`() {
    GlobalAttributes.set(["tier": "pro", "variant": "B"])
    let merged = GlobalAttributes.merged(with: nil)
    let attributes = try! #require(merged)
    #expect(attributes.count == 2)
    #expect(attributes["tier"] as? String == "pro")
    #expect(attributes["variant"] as? String == "B")
  }

  @Test
  func `merged combines globals and per-event attributes`() {
    GlobalAttributes.set(["tier": "pro"])
    let merged = GlobalAttributes.merged(with: ["screen": "home"])
    let attributes = try! #require(merged)
    #expect(attributes.count == 2)
    #expect(attributes["tier"] as? String == "pro")
    #expect(attributes["screen"] as? String == "home")
  }

  @Test
  func `per-event attributes win on key collision`() {
    GlobalAttributes.set(["tier": "pro"])
    let merged = GlobalAttributes.merged(with: ["tier": "trial"])
    let attributes = try! #require(merged)
    #expect(attributes.count == 1)
    #expect(attributes["tier"] as? String == "trial")
  }

  @Test
  func `set replaces the previous store (not merges)`() {
    GlobalAttributes.set(["tier": "pro", "variant": "B"])
    GlobalAttributes.set(["tier": "trial"])
    let merged = GlobalAttributes.merged(with: nil)
    let attributes = try! #require(merged)
    #expect(attributes.count == 1)
    #expect(attributes["tier"] as? String == "trial")
    #expect(attributes["variant"] == nil)
  }

  @Test
  func `set with empty map clears the store`() {
    GlobalAttributes.set(["tier": "pro"])
    GlobalAttributes.set([:])
    #expect(GlobalAttributes.merged(with: nil) == nil)
  }

  @Test
  func `set with nil clears the store`() {
    GlobalAttributes.set(["tier": "pro"])
    GlobalAttributes.set(nil)
    #expect(GlobalAttributes.merged(with: nil) == nil)
  }

  @Test
  func `set sanitizes reserved keys before storing`() {
    GlobalAttributes.set([
      "expo.app.name": "spoofed",
      "session.id": "spoofed",
      "tier": "pro"
    ])
    let merged = GlobalAttributes.merged(with: nil)
    let attributes = try! #require(merged)
    #expect(attributes.count == 1)
    #expect(attributes["tier"] as? String == "pro")
  }
}
