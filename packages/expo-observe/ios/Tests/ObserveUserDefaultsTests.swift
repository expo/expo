import Testing

@testable import ExpoObserve
import ExpoAppMetrics

@AppMetricsActor
@Suite("ObserveUserDefaults")
struct ObserveUserDefaultsTests {
  init() {
    // Remove the persistent domain to simulate a fresh install between tests.
    UserDefaults.standard.removePersistentDomain(forName: "dev.expo.observe")
  }

  @Test
  func `config defaults to nil`() {
    #expect(ObserveUserDefaults.config == nil)
  }

  @Test
  func `setConfig with dispatchingEnabled false persists false`() {
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchingEnabled: false))
    #expect(ObserveUserDefaults.config?.dispatchingEnabled == false)
  }

  @Test
  func `setConfig overwrites previous value`() {
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchingEnabled: false))
    #expect(ObserveUserDefaults.config?.dispatchingEnabled == false)
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchingEnabled: true))
    #expect(ObserveUserDefaults.config?.dispatchingEnabled == true)
  }

  @Test
  func `setConfig with nil field clears previously set value`() {
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchingEnabled: false))
    #expect(ObserveUserDefaults.config?.dispatchingEnabled == false)
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchingEnabled: nil))
    #expect(ObserveUserDefaults.config != nil)
    #expect(ObserveUserDefaults.config?.dispatchingEnabled == nil)
  }
}
