import Testing

@testable import ExpoAppMetrics

@Suite("validateEventName")
struct EventNameValidationTests {
  @Test
  func `accepts a regular name and returns it unchanged`() {
    #expect(validateEventName("auth.login_failed") == "auth.login_failed")
  }

  @Test
  func `trims surrounding whitespace`() {
    #expect(validateEventName("  user.signed_in\n") == "user.signed_in")
  }

  @Test
  func `rejects an empty name`() {
    #expect(validateEventName("") == nil)
  }

  @Test
  func `rejects a whitespace-only name`() {
    #expect(validateEventName("   \t\n") == nil)
  }

  @Test
  func `rejects names that use the reserved expo prefix`() {
    #expect(validateEventName("expo.app_startup.tti") == nil)
    #expect(validateEventName("expo.something") == nil)
  }

  @Test
  func `accepts names containing 'expo' as long as it isn't the prefix`() {
    #expect(validateEventName("my_expo.event") == "my_expo.event")
    #expect(validateEventName("app.expo.thing") == "app.expo.thing")
  }

  @Test
  func `rejects names longer than the cap`() {
    let oversized = String(repeating: "a", count: 257)
    #expect(validateEventName(oversized) == nil)
  }

  @Test
  func `accepts names exactly at the cap`() {
    let atLimit = String(repeating: "a", count: 256)
    #expect(validateEventName(atLimit) == atLimit)
  }
}
