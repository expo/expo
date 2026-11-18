import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("ObserveConsent")
struct ObserveConsentTests {
  private func appConfig(consent: Any) -> [String: Any] {
    return ["extra": ["eas": ["observe": ["consent": consent]]]]
  }

  @Test
  func `app config without the consent key grants consent`() {
    #expect(ObserveConsent.isGranted(appConfig: nil))
    #expect(ObserveConsent.isGranted(appConfig: ["extra": ["eas": ["projectId": "id"]]]))
  }

  @Test
  func `consent key granted grants consent`() {
    #expect(ObserveConsent.isGranted(appConfig: appConfig(consent: "granted")))
  }

  @Test
  func `consent key not-granted denies consent`() {
    #expect(!ObserveConsent.isGranted(appConfig: appConfig(consent: "not-granted")))
  }

  @Test
  func `unknown consent value denies consent`() {
    #expect(!ObserveConsent.isGranted(appConfig: appConfig(consent: "pending")))
    #expect(!ObserveConsent.isGranted(appConfig: appConfig(consent: false)))
  }
}

@Suite("ConsentGatedDefaults", .serialized)
struct ConsentGatedDefaultsTests {
  private let suiteName = "dev.expo.app-metrics.tests.consent-gated"

  init() {
    UserDefaults.standard.removePersistentDomain(forName: suiteName)
  }

  private struct Value: Codable, Equatable {
    var name: String
  }

  @Test
  func `saves nothing while consent is not granted and keeps the values in memory`() throws {
    let defaults = ConsentGatedDefaults(try #require(UserDefaults(suiteName: suiteName)), isGranted: { false })

    defaults.set("staging", forKey: "string")
    defaults.set(Int64(5), forKey: "integer")
    defaults.set(codable: Value(name: "value"), forKey: "codable")
    defaults.set("removed", forKey: "removed")
    defaults.set(nil, forKey: "removed")

    #expect(defaults.object(forKey: "string") as? String == "staging")
    #expect(defaults.object(forKey: "integer") as? Int64 == 5)
    #expect(defaults.codable(forKey: "codable", as: Value.self) == Value(name: "value"))
    #expect(defaults.object(forKey: "removed") == nil)
    #expect(UserDefaults.standard.persistentDomain(forName: suiteName)?.isEmpty ?? true)
  }

  @Test
  func `saves to the suite while consent is granted`() throws {
    let defaults = ConsentGatedDefaults(try #require(UserDefaults(suiteName: suiteName)), isGranted: { true })

    defaults.set("production", forKey: "string")

    #expect(defaults.object(forKey: "string") as? String == "production")
    #expect(UserDefaults.standard.persistentDomain(forName: suiteName)?["string"] as? String == "production")
  }
}
