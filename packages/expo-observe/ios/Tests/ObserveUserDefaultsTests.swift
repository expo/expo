import Testing

@testable import ExpoObserve
import ExpoAppMetrics

@AppMetricsActor
@Suite("ObserveUserDefaults", .serialized)
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

  @Test
  func `sampleRate defaults to nil`() {
    #expect(ObserveUserDefaults.config?.sampleRate == nil)
  }

  @Test
  func `setConfig with sampleRate persists Double value`() {
    ObserveUserDefaults.setConfig(PersistedConfig(sampleRate: 0.25))
    #expect(ObserveUserDefaults.config?.sampleRate == 0.25)
  }

  @Test
  func `setConfig sampleRate 0_0 is distinct from nil`() {
    ObserveUserDefaults.setConfig(PersistedConfig(sampleRate: 0.0))
    #expect(ObserveUserDefaults.config?.sampleRate == 0.0)
  }

  @Test
  func `setConfig sampleRate nil clears previously set value`() {
    ObserveUserDefaults.setConfig(PersistedConfig(sampleRate: 0.5))
    #expect(ObserveUserDefaults.config?.sampleRate == 0.5)
    ObserveUserDefaults.setConfig(PersistedConfig(sampleRate: nil))
    #expect(ObserveUserDefaults.config?.sampleRate == nil)
  }

  @Test
  func `dispatchInDebug defaults to nil`() {
    #expect(ObserveUserDefaults.config?.dispatchInDebug == nil)
  }

  @Test
  func `setConfig with dispatchInDebug true persists true`() {
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchInDebug: true))
    #expect(ObserveUserDefaults.config?.dispatchInDebug == true)
  }

  @Test
  func `setConfig with dispatchInDebug false persists false`() {
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchInDebug: false))
    #expect(ObserveUserDefaults.config?.dispatchInDebug == false)
  }

  @Test
  func `setConfig dispatchInDebug nil clears previously set value`() {
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchInDebug: true))
    #expect(ObserveUserDefaults.config?.dispatchInDebug == true)
    ObserveUserDefaults.setConfig(PersistedConfig(dispatchInDebug: nil))
    #expect(ObserveUserDefaults.config?.dispatchInDebug == nil)
  }
}
