import Testing

@testable import ExpoAppMetrics

@Suite("validateEventBody")
struct EventBodyValidationTests {
  @Test
  func `returns nil when input is nil`() {
    #expect(validateEventBody(nil) == nil)
  }

  @Test
  func `passes through a short body unchanged`() {
    #expect(validateEventBody("hello") == "hello")
  }

  @Test
  func `passes through a body exactly at the cap`() {
    let atLimit = String(repeating: "a", count: 4096)
    #expect(validateEventBody(atLimit) == atLimit)
  }

  @Test
  func `truncates a body just past the cap`() {
    let oversized = String(repeating: "a", count: 4097)
    let result = try! #require(validateEventBody(oversized))
    #expect(result.count == 4096)
    #expect(result.hasSuffix("…"))
  }

  @Test
  func `truncates a long body and appends the ellipsis`() {
    let oversized = String(repeating: "x", count: 10_000)
    let result = try! #require(validateEventBody(oversized))
    #expect(result.count == 4096)
    #expect(result.hasSuffix("…"))
    // Prefix is preserved (start of the original body survives).
    #expect(result.hasPrefix("xxxx"))
  }

  @Test
  func `passes through an empty body`() {
    #expect(validateEventBody("") == "")
  }
}
