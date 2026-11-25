import AVFoundation
import Foundation
import Testing

@testable import ExpoMediaSession

@Suite("SessionUseCommands")
struct SessionUseCommandTests {
  let scheduler = ManualScheduler()
  let backend = FakeSessionBackend()
  let observer = RecordingObserver()
  let delegate = RecordingUseDelegate()
  let manager: MediaSessionManager
  let registration: any ObserverRegistration

  init() throws {
    manager = MediaSessionManager(backend: backend, scheduler: scheduler, nowPlayingCenter: FakeNowPlayingCenter())
    registration = manager.addObserver(observer)
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMix))
    backend.clearCalls()
  }

  private func begin(_ name: String, _ requirements: SessionRequirements = .init()) -> any SessionUse {
    let use = manager.beginUse(client: name, requirements: requirements, delegate: delegate, queue: delegate.queue)
    delegate.name(use, name)
    return use
  }

  private var deactivations: Int {
    backend.calls.filter {
      if case .deactivate = $0 {
        return true
      }
      return false
    }.count
  }

  @Test
  func testInterruptionPausesAndResumesLiveUses() {
    let a = begin("a")
    let b = begin("b")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: true)

    #expect(
      delegate.commands == [
        .pause("a", .interruption), .pause("b", .interruption), .resume("a"), .resume("b"),
      ]
    )
    #expect(manager.coordinator.useCount == 2)
    a.end()
    b.end()
  }

  @Test
  func testInterruptionWithoutResumeEndsPausedUses() {
    let a = begin("a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: false)

    #expect(delegate.commands == [.pause("a", .interruption), .ended("a")])
    #expect(manager.coordinator.useCount == 0)
    scheduler.advance(milliseconds: 1000)
    #expect(deactivations == 1)
    a.end()
    #expect(deactivations == 1)
  }

  @Test
  func testUseEndedDuringInterruptionGetsNoResume() {
    let a = begin("a")
    let b = begin("b")
    delegate.queue.suspend()
    manager.coordinator.interruptionBegan(reason: .default)
    a.end()
    delegate.queue.resume()
    manager.coordinator.interruptionEnded(shouldResume: true)

    #expect(delegate.commands == [.pause("b", .interruption), .resume("b")])
    b.end()
  }

  @Test
  func testUsesWithoutDelegateAndHoldsGetNoCommands() {
    let use = manager.beginUse(client: "plain")
    let hold = manager.hold(client: "hold")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: false)
    manager.coordinator.routeChanged(.oldDeviceUnavailable)

    #expect(delegate.commands.isEmpty)
    #expect(manager.coordinator.useCount == 2)
    use.end()
    hold.release()
  }

  @Test
  func testDeferredInterruptionEndResumesAfterWritesResume() {
    let a = begin("a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.suspendWrites(reason: "call")
    manager.coordinator.interruptionEnded(shouldResume: true)
    #expect(delegate.commands == [.pause("a", .interruption)])

    manager.resumeWrites()
    #expect(delegate.commands == [.pause("a", .interruption), .resume("a")])
    a.end()
  }

  @Test
  func testUnplugPausesAndEndsPlaybackUsesOnly() {
    let player = begin("player")
    let recorder = begin("recorder", SessionRequirements(capabilities: .record))
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.routeChanged(.oldDeviceUnavailable)
    manager.coordinator.interruptionEnded(shouldResume: true)

    #expect(
      delegate.commands == [
        .pause("player", .interruption), .pause("recorder", .interruption),
        .pause("player", .outputDisconnected), .ended("player"), .resume("recorder"),
      ]
    )
    #expect(manager.coordinator.useCount == 1)
    player.end()
    recorder.end()
  }

  @Test
  func testServicesResetResumesInterruptedUses() {
    let a = begin("a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.mediaServicesWereReset()

    #expect(delegate.commands == [.pause("a", .interruption), .resume("a")])
    a.end()
  }

  @Test
  func testFailedActivationFailsAndEndsThatUseOnly() {
    let a = begin("a")
    backend.failActivation(with: NSError(domain: NSOSStatusErrorDomain, code: 561_017_449))
    manager.coordinator.interruptionBegan(reason: .default)
    delegate.clear()
    let b = begin("b")

    #expect(delegate.commands == [.failed("b"), .ended("b")])
    #expect(observer.events.last == .failed(client: "b"))
    #expect(manager.coordinator.useCount == 1)
    a.end()
    b.end()
  }

  @Test
  func testRejectedConfigurationFailsAndEndsTheUse() {
    backend.failConfiguration(with: NSError(domain: NSOSStatusErrorDomain, code: -50))
    let a = begin("a", SessionRequirements(mode: .spokenAudio))

    #expect(delegate.commands == [.failed("a"), .ended("a")])
    #expect(observer.events == [.failed(client: "a")])
    #expect(manager.coordinator.useCount == 0)
    a.end()
  }

  @Test
  func testBackgroundPausesOnlyOptedOutUses() {
    let foreground = begin("foreground")
    let background = begin("background", SessionRequirements(continuesInBackground: true))
    manager.coordinator.didEnterBackground()
    manager.coordinator.willEnterForeground()

    #expect(delegate.commands == [.pause("foreground", .background), .resume("foreground")])
    foreground.end()
    background.end()
  }

  @Test
  func testForegroundDuringInterruptionWaitsForTheEnd() {
    let a = begin("a")
    manager.coordinator.didEnterBackground()
    manager.coordinator.interruptionBegan(reason: .default)
    backend.failActivation(with: NSError(domain: NSOSStatusErrorDomain, code: 561_017_449))
    manager.coordinator.willEnterForeground()
    #expect(delegate.commands == [.pause("a", .background)])
    #expect(!observer.events.contains(.failed(client: "a")))

    backend.failActivation(with: nil)
    manager.coordinator.interruptionEnded(shouldResume: true)
    #expect(delegate.commands == [.pause("a", .background), .resume("a")])
    a.end()
  }

  @Test
  func testForegroundActivationFailureFailsTheUse() {
    let a = begin("a")
    manager.coordinator.didEnterBackground()
    backend.failActivation(with: NSError(domain: NSOSStatusErrorDomain, code: 561_017_449))
    manager.coordinator.willEnterForeground()

    #expect(delegate.commands == [.pause("a", .background), .failed("a"), .ended("a")])
    #expect(manager.coordinator.useCount == 0)
    a.end()
  }

  @Test
  func testInterruptionEndingInBackgroundResumesOnForeground() {
    let a = begin("a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.didEnterBackground()
    manager.coordinator.interruptionEnded(shouldResume: true)
    #expect(delegate.commands == [.pause("a", .interruption)])

    manager.coordinator.willEnterForeground()
    #expect(delegate.commands == [.pause("a", .interruption), .resume("a")])
    a.end()
  }

  @Test
  func testUseBegunInBackgroundIsNotPaused() {
    manager.coordinator.didEnterBackground()
    let a = begin("a")
    manager.coordinator.willEnterForeground()

    #expect(delegate.commands.isEmpty)
    a.end()
  }

  @Test
  func testSystemPausedUseKeepsTheSession() {
    let a = begin("a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.didEnterBackground()
    scheduler.advance(milliseconds: 2000)

    #expect(deactivations == 0)
    a.end()
  }

  @Test
  func testDuckOthersInterruptionDucksInsteadOfPausing() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .duckOthers))
    let a = begin("a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: false)

    #expect(delegate.commands == [.duck("a", true), .duck("a", false)])
    #expect(manager.coordinator.useCount == 1)
    a.end()
  }

  @Test
  func testDoNotMixUseMakesDuckOthersPause() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .duckOthers))
    let a = begin("a", SessionRequirements(mixing: .doNotMix))
    manager.coordinator.interruptionBegan(reason: .default)

    #expect(delegate.commands == [.pause("a", .interruption)])
    a.end()
  }

  @Test
  func testUnplugRestoresTheDuckBeforeEnding() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .duckOthers))
    let a = begin("a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.routeChanged(.oldDeviceUnavailable)

    #expect(
      delegate.commands == [.duck("a", true), .pause("a", .outputDisconnected), .duck("a", false), .ended("a")]
    )
    a.end()
  }

  @Test
  func testDeallocatedDelegateGetsNothing() {
    var transient: RecordingUseDelegate? = RecordingUseDelegate()
    let use = manager.beginUse(client: "a", requirements: .init(), delegate: transient)
    transient = nil
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: true)

    #expect(manager.coordinator.useCount == 1)
    use.end()
  }

  @Test
  func testPolicyIsWrittenWithoutAUse() throws {
    try manager.setPolicy(AudioPolicyUpdate(allowsRecording: true))

    #expect(backend.configuration?.configuration.category == .playAndRecord)
    #expect(manager.coordinator.useCount == 0)
  }

  @Test
  func testModuleEndIsReportedAfterTheLastCommand() {
    let a = begin("a")
    manager.coordinator.routeChanged(.oldDeviceUnavailable)

    #expect(delegate.commands == [.pause("a", .outputDisconnected), .ended("a")])
  }

  @Test
  func testActivationAfterAMissingInterruptionEndEndsTheDuck() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .duckOthers))
    let a = begin("a")
    manager.coordinator.interruptionBegan(reason: .default)
    let b = begin("b")

    #expect(delegate.commands == [.duck("a", true), .duck("a", false)])
    a.end()
    b.end()
  }

  @Test
  func testNoCommandRunsAfterTheClientEndsTheUse() {
    let a = begin("a")
    delegate.queue.suspend()
    manager.coordinator.interruptionBegan(reason: .default)
    a.end()
    delegate.queue.resume()

    #expect(delegate.commands.isEmpty)
  }
}
