import AVFoundation
import ExpoModulesCore
import Foundation
import Testing

@testable import ExpoMediaSession

@Suite("SessionCoordinator")
struct SessionCoordinatorTests {
  let scheduler = ManualScheduler()
  let backend = FakeSessionBackend()
  let observer = RecordingObserver()
  let manager: MediaSessionManager
  let registration: ObserverRegistration

  init() throws {
    manager = MediaSessionManager(backend: backend, scheduler: scheduler, nowPlayingCenter: FakeNowPlayingCenter())
    registration = manager.addObserver(observer)
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMix))
  }

  private func resolved(_ requirements: [SessionRequirements] = [.init()]) -> ResolvedSession {
    SessionResolver.resolve(policy: manager.policy, requirements: requirements)
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
  func testFirstUseActivates() async throws {
    let use = manager.beginUse(client: "a")
    try await use.activated()

    #expect(backend.calls == [.configure(resolved()), .activate])
    use.end()
  }

  @Test
  func testReleaseAfterOneSecondHold() {
    manager.beginUse(client: "a").end()

    scheduler.advance(milliseconds: 999)
    #expect(deactivations == 0)
    scheduler.advance(milliseconds: 1)
    #expect(backend.calls.last == .deactivate(notifyingOthers: true))
    #expect(deactivations == 1)
  }

  @Test
  func testNewUseCancelsPendingRelease() {
    manager.beginUse(client: "a").end()
    scheduler.advance(milliseconds: 500)
    let second = manager.beginUse(client: "b")
    scheduler.advance(milliseconds: 2000)

    #expect(deactivations == 0)
    #expect(backend.count(.activate) == 1)
    second.end()
  }

  @Test
  func testBeginAfterReleaseIsDueCancelsIt() {
    manager.beginUse(client: "a").end()
    scheduler.enqueueDueTimers(advancingBy: 1000)
    let second = manager.beginUse(client: "b")

    #expect(deactivations == 0)
    #expect(backend.count(.activate) == 1)
    second.end()
  }

  @Test
  func testBeginDuringDeactivationReactivates() {
    manager.beginUse(client: "a").end()
    let second = Box<SessionUse?>(nil)
    backend.duringDeactivation { [manager] in
      second.value = manager.beginUse(client: "b")
    }
    scheduler.advance(milliseconds: 1000)

    #expect(backend.calls.suffix(2) == [.deactivate(notifyingOthers: true), .activate])
    #expect(manager.coordinator.useCount == 1)
    second.value?.end()
  }

  @Test
  func testMixWithOthersNeverDeactivates() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .mixWithOthers))
    manager.beginUse(client: "a").end()
    scheduler.advance(milliseconds: 10_000)

    #expect(backend.calls == [.configure(resolved()), .activate])
  }

  @Test
  func testLastUseEndRestoresThePolicyCategory() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .mixWithOthers))
    let recording = SessionRequirements(capabilities: .record)
    let suspended = manager.beginUse(client: "a", requirements: recording)
    #expect(backend.live.category == .playAndRecord)

    manager.suspendWrites(reason: "call")
    suspended.end()
    #expect(backend.live.category == .playAndRecord)
    manager.resumeWrites()

    manager.beginUse(client: "b", requirements: recording).end()
    #expect(backend.calls.last == .configure(resolved([])))
    #expect(backend.live == resolved([]).configuration)
    scheduler.advance(milliseconds: 2000)
    #expect(deactivations == 0)
  }

  @Test
  func testRecordOnlyUseReleasesAndRestoresThePolicyCategory() throws {
    try manager.setPolicy(AudioPolicyUpdate(playsInSilentMode: false, interruptionMode: .mixWithOthers))
    manager.beginUse(client: "a", requirements: SessionRequirements(capabilities: .record)).end()
    #expect(backend.live.category == .ambient)

    scheduler.advance(milliseconds: 1000)
    #expect(backend.calls.last == .deactivate(notifyingOthers: true))
  }

  @Test
  func testHoldTokensAreIndependent() {
    let first = manager.hold(client: "a")
    let second = manager.hold(client: "b")
    first.release()
    first.release()
    scheduler.advance(milliseconds: 2000)
    #expect(deactivations == 0)

    second.release()
    scheduler.advance(milliseconds: 999)
    #expect(deactivations == 0)
    scheduler.advance(milliseconds: 1)
    #expect(deactivations == 1)

    var dropped: SessionHold? = manager.hold(client: "c")
    #expect(manager.coordinator.useCount == 1)
    _ = dropped
    dropped = nil
    #expect(manager.coordinator.useCount == 0)
    scheduler.advance(milliseconds: 1000)
    #expect(deactivations == 2)
  }

  @Test
  func testSetPolicyWithoutUseWritesNothing() throws {
    try manager.setPolicy(
      AudioPolicyUpdate(playsInSilentMode: true, interruptionMode: .duckOthers, allowsRecording: true)
    )
    #expect(backend.calls.isEmpty)
    #expect(manager.policy.interruptionMode == .duckOthers)

    let use = manager.beginUse(client: "a")
    #expect(backend.calls.first == .configure(resolved()))
    #expect(backend.configuration?.configuration.category == .playAndRecord)
    #expect(backend.configuration?.configuration.options.contains(.duckOthers) == true)
    use.end()
  }

  @Test
  func testSuspendFreezesWrites() throws {
    manager.suspendWrites(reason: "call")
    manager.beginUse(client: "a").end()
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .duckOthers))
    let use = manager.beginUse(client: "b", requirements: SessionRequirements(mode: .spokenAudio))
    scheduler.advance(milliseconds: 2000)

    #expect(backend.calls.isEmpty)
    #expect(observer.events == [.suspended(reason: "call")])
    #expect(manager.coordinator.useCount == 1)

    manager.resumeWrites()
    #expect(backend.calls == [.configure(resolved([SessionRequirements(mode: .spokenAudio)])), .activate])
    #expect(observer.events == [.suspended(reason: "call"), .resumed])
    use.end()
  }

  @Test
  func testConcurrentBeginEndConverges() {
    DispatchQueue.concurrentPerform(iterations: 8) { thread in
      var open: [SessionUse] = []
      for index in 0..<1000 {
        let use = manager.beginUse(client: "thread-\(thread)")
        if index.isMultiple(of: 2) {
          use.end()
        } else {
          open.append(use)
        }
      }
      for use in open {
        use.end()
      }
    }

    #expect(manager.coordinator.useCount == 0)
    #expect(backend.count(.activate) == 1)
    #expect(deactivations == 0)
    scheduler.advance(milliseconds: 1000)
    #expect(deactivations == 1)
  }

  @Test
  func testActivationFailureReportsAndDoesNotLeakUse() async {
    let platformError = NSError(domain: NSOSStatusErrorDomain, code: 561_017_449)
    backend.failActivation(with: platformError)
    let use = manager.beginUse(client: "a")

    do {
      try await use.activated()
      Issue.record("Expected activated() to throw")
    } catch {
      #expect(error is MediaSessionException)
      #expect((error as? MediaSessionException)?.cause as? NSError == platformError)
    }
    #expect(observer.events == [.failed(client: "a")])

    use.end()
    scheduler.advance(milliseconds: 5000)
    #expect(manager.coordinator.useCount == 0)
    #expect(backend.calls == [.configure(resolved()), .activate])
  }

  @Test
  func testInapplicableOptionsAreDropped() async throws {
    let speaker = manager.beginUse(
      client: "speaker",
      requirements: SessionRequirements(extraOptions: .defaultToSpeaker)
    )
    try await speaker.activated()
    #expect(backend.configuration?.configuration.category == .playback)
    #expect(backend.configuration?.configuration.options.contains(.defaultToSpeaker) == false)

    let other = manager.beginUse(client: "other", requirements: SessionRequirements(mode: .moviePlayback))
    try await other.activated()
    #expect(backend.configuration?.configuration.mode == .moviePlayback)
    #expect(
      !backend.calls.contains {
        if case .configure(let session) = $0 {
          return session.configuration.options.contains(.defaultToSpeaker)
        }
        return false
      }
    )
    #expect(observer.events.isEmpty)
    other.end()
    speaker.end()
  }

  @Test
  func testLiveSessionChangeIsCorrected() {
    let use = manager.beginUse(client: "a")
    backend.live = SessionConfiguration(category: .ambient)
    use.update(SessionRequirements())

    #expect(backend.calls.last == .configure(resolved()))
    #expect(backend.live == resolved().configuration)
    use.end()
  }

  @Test
  func testReleaseUsesLastGoodSessionAfterConfigureFailure() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMixPersistent))
    let use = manager.beginUse(client: "a")
    backend.rejectSampleRate(96_000)
    use.update(SessionRequirements(preferredSampleRate: 96_000))
    #expect(observer.events == [.failed(client: "a")])

    use.end()
    scheduler.advance(milliseconds: 1000)
    #expect(backend.calls.last == .deactivate(notifyingOthers: false))
  }

  @Test
  func testMixWithOthersStaysActiveAfterConfigureFailure() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .mixWithOthers))
    let use = manager.beginUse(client: "a")
    backend.rejectSampleRate(96_000)
    use.update(SessionRequirements(preferredSampleRate: 96_000))
    use.end()
    scheduler.advance(milliseconds: 2000)

    #expect(deactivations == 0)
  }

  @Test
  func testPartialConfigureFollowsLiveSession() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .mixWithOthers))
    let strict = manager.beginUse(client: "strict", requirements: SessionRequirements(mixing: .doNotMix))
    backend.rejectSampleRate(96_000)
    let fast = manager.beginUse(client: "fast", requirements: SessionRequirements(preferredSampleRate: 96_000))
    strict.end()
    #expect(observer.events.allSatisfy { $0 == .failed(client: "fast") })
    #expect(backend.live.options.contains(.mixWithOthers))

    fast.end()
    scheduler.advance(milliseconds: 2000)
    #expect(deactivations == 0)
  }

  @Test
  func testActivationWaitsForResume() async throws {
    manager.suspendWrites(reason: "call")
    let use = manager.beginUse(client: "a")
    #expect(use.isActivationPending)
    #expect(backend.calls.isEmpty)

    manager.resumeWrites()
    try await use.activated()
    #expect(backend.calls == [.configure(resolved()), .activate])
    use.end()
  }

  @Test
  func testUpdateRequirementsReconfigures() {
    let use = manager.beginUse(client: "a")
    use.update(SessionRequirements(mode: .moviePlayback))

    guard case .configure(let session) = backend.calls.last else {
      Issue.record("Expected a configure, got \(backend.calls)")
      return
    }
    #expect(session.configuration.mode == .moviePlayback)
    #expect(backend.count(.activate) == 1)
    use.end()
  }

  @Test
  func testActivatedResolvesAfterActivationAndThrowsOnFailure() async throws {
    let use = manager.beginUse(client: "a")
    try await use.activated()
    try await use.activated()
    #expect(backend.calls == [.configure(resolved()), .activate])
    use.end()
    await #expect(throws: SessionUseEndedException.self) {
      try await use.activated()
    }
    scheduler.advance(milliseconds: 1000)

    backend.failActivation(with: NSError(domain: NSOSStatusErrorDomain, code: 1))
    let hold = manager.hold(client: "b")
    await #expect(throws: MediaSessionException.self) {
      try await hold.activated()
    }
    hold.release()
    #expect(manager.coordinator.useCount == 0)
  }

  @Test
  func testManagerKeepsObserverUntilRegistrationIsRemoved() {
    weak var released: RecordingObserver?
    var registration: ObserverRegistration?
    do {
      let unowned = RecordingObserver()
      released = unowned
      registration = manager.addObserver(unowned)
    }
    manager.suspendWrites(reason: "call")
    #expect(released?.events == [.suspended(reason: "call")])

    registration?.remove()
    #expect(released == nil)
    _ = registration
  }

  @Test
  func testRemovingRegistrationStopsDeliveryFromAnyThread() {
    let second = RecordingObserver()
    let registration = manager.addObserver(second)
    DispatchQueue.concurrentPerform(iterations: 8) { _ in
      registration.remove()
    }
    manager.suspendWrites(reason: "call")

    #expect(second.events.isEmpty)
    #expect(observer.events == [.suspended(reason: "call")])
  }

  @Test
  func testDeallocatedRegistrationRemovesObserver() {
    let second = RecordingObserver()
    var registration: ObserverRegistration? = manager.addObserver(second)
    _ = registration
    registration = nil
    manager.suspendWrites(reason: "call")

    #expect(second.events.isEmpty)
  }

  private func outcome(of waiter: Task<Void, Error>, then finish: () -> Void) async -> String {
    await withTaskGroup(of: String.self) { group in
      group.addTask {
        do {
          try await waiter.value
          return "returned"
        } catch is CancellationError {
          return "cancelled"
        } catch {
          return "\(error)"
        }
      }
      group.addTask {
        try? await Task.sleep(for: .seconds(1))
        return "timed out"
      }
      let first = await group.next() ?? ""
      finish()
      group.cancelAll()
      return first
    }
  }

  @Test
  func testCancelledActivationWaitThrowsWithoutEndingUse() async {
    manager.suspendWrites(reason: "call")
    let use = manager.beginUse(client: "a")
    let waiter = Task { try await use.activated() }
    while use.activationWaiterCount == 0 {
      await Task.yield()
    }
    waiter.cancel()

    let result = await outcome(of: waiter) {
      #expect(use.isActivationPending)
      #expect(manager.coordinator.useCount == 1)
      #expect(manager.coordinator.pendingActivationCount == 1)
      use.end()
    }

    #expect(result == "cancelled")
    #expect(manager.coordinator.useCount == 0)
    #expect(manager.coordinator.pendingActivationCount == 0)
  }

  @Test
  func testAlreadyCancelledTaskDoesNotWaitForActivation() async {
    manager.suspendWrites(reason: "call")
    let hold = manager.hold(client: "a")
    let waiter = Task {
      withUnsafeCurrentTask { $0?.cancel() }
      try await hold.activated()
    }

    let result = await outcome(of: waiter) {
      hold.release()
    }

    #expect(result == "cancelled")
  }
}
