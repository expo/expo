import Foundation
import Testing

@testable import ExpoMediaSession

@Suite("JSSessionUse")
struct JSSessionUseTests {
  let scheduler = ManualScheduler()
  let backend = FakeSessionBackend()
  let manager: MediaSessionManager

  init() throws {
    manager = MediaSessionManager(backend: backend, scheduler: scheduler, nowPlayingCenter: FakeNowPlayingCenter())
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMix))
  }

  @Test
  func testBeginsAUseWithTheRequirements() {
    let record = SessionRequirementsRecord(mixing: .duckOthers, capabilities: ["record"], continuesInBackground: true)
    let use = JSSessionUse(client: "js", requirements: record.requirements, manager: manager)

    #expect(manager.coordinator.useCount == 1)
    #expect(backend.configuration?.configuration.category == .playAndRecord)
    use.end()
  }

  @Test
  func testEndEndsTheUseOnce() {
    let use = JSSessionUse(client: "js", requirements: .init(), manager: manager)
    use.end()
    use.end()

    #expect(manager.coordinator.useCount == 0)
  }

  @Test
  func testReleaseEndsTheUse() {
    let use = JSSessionUse(client: "js", requirements: .init(), manager: manager)
    use.sharedObjectDidRelease()

    #expect(manager.coordinator.useCount == 0)
  }
}
