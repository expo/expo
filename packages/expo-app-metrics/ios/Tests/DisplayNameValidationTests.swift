import Testing

@testable import ExpoAppMetrics

@Suite("validateDisplayName")
struct DisplayNameValidationTests {
  @Test
  func `returns nil when input is nil`() {
    #expect(validateDisplayName(nil) == nil)
  }

  @Test
  func `passes through a short display name unchanged`() {
    #expect(validateDisplayName("Login failed") == "Login failed")
  }

  @Test
  func `trims surrounding whitespace`() {
    #expect(validateDisplayName("  Login failed\n") == "Login failed")
  }

  @Test
  func `returns nil for an empty display name`() {
    #expect(validateDisplayName("") == nil)
  }

  @Test
  func `returns nil for a whitespace-only display name`() {
    #expect(validateDisplayName("   \t\n") == nil)
  }

  @Test
  func `passes through a display name exactly at the cap`() {
    let atLimit = String(repeating: "a", count: 128)
    #expect(validateDisplayName(atLimit) == atLimit)
  }

  @Test
  func `truncates a display name just past the cap`() {
    let oversized = String(repeating: "a", count: 129)
    let result = try! #require(validateDisplayName(oversized))
    #expect(result.count == 128)
    #expect(result.hasSuffix("…"))
  }
}
