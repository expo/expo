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
