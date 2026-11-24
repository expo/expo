import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite
struct ObserveConsentColdStartTests {
  @Test
  func `a revoke on first access closes a previously granted gate`() {
    let defaults = UserDefaults.standard
    let key = ObserveConsent.savedValueKey
    let previous = defaults.object(forKey: key)
    defer { defaults.set(previous, forKey: key) }
    defaults.set("granted", forKey: key)

    #expect(ObserveConsent.update(granted: false))
    #expect(ObserveConsent.state == .notGranted)
    #expect(defaults.string(forKey: key) == "not-granted")
  }
}
