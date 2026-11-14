import AVFoundation
import Foundation
import Testing
import UIKit

@testable import ExpoMediaSession

@Suite("SystemEvents")
struct SystemEventTests {
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

  private var configures: Int {
    backend.calls.filter {
      if case .configure = $0 {
        return true
      }
      return false
    }.count
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
  func testInterruptionClearsActiveState() {
    let first = manager.beginUse(client: "a")
    manager.coordinator.interruptionBegan(reason: .default)
    #expect(deactivations == 0)
    let second = manager.beginUse(client: "b")

    #expect(backend.count(.activate) == 2)
    first.end()
    second.end()
  }

  @Test
  func testInterruptionWithoutResumeStillReleases() {
    let use = manager.beginUse(client: "a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: false)
    use.end()
    scheduler.advance(milliseconds: 1000)

    #expect(backend.calls.last == .deactivate(notifyingOthers: true))
    #expect(backend.count(.activate) == 1)
  }

  @Test
  func testFailedReactivationReportsNoResume() {
    let use = manager.beginUse(client: "a")
    manager.coordinator.interruptionBegan(reason: .default)
    backend.failActivation(with: NSError(domain: NSOSStatusErrorDomain, code: 561_017_449))
    manager.coordinator.interruptionEnded(shouldResume: true)

    #expect(
      observer.events == [.interruptionBegan(.default), .failed(client: "a"), .interruptionEnded(shouldResume: false)]
    )
    use.end()
  }

  @Test
  func testInterruptionEndedWaitsForResume() {
    let use = manager.beginUse(client: "a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.suspendWrites(reason: "call")
    manager.coordinator.interruptionEnded(shouldResume: true)
    #expect(observer.events == [.interruptionBegan(.default), .suspended(reason: "call")])

    manager.resumeWrites()
    #expect(observer.events.suffix(2) == [.resumed, .interruptionEnded(shouldResume: true)])
    #expect(backend.count(.activate) == 2)
    use.end()
  }

  @Test
  func testSystemEventSourceForwardsNotifications() {
    let use = manager.beginUse(client: "a")
    let center = NotificationCenter()
    let session = AVAudioSession.sharedInstance()
    let source = SystemEventSource(coordinator: manager.coordinator, center: center, session: session)
    let interruption = AVAudioSession.interruptionNotification
    let began = AVAudioSession.InterruptionType.began.rawValue
    let ended = AVAudioSession.InterruptionType.ended.rawValue

    center.post(name: interruption, object: session, userInfo: [AVAudioSessionInterruptionTypeKey: began])
    center.post(
      name: interruption,
      object: session,
      userInfo: [
        AVAudioSessionInterruptionTypeKey: began,
        AVAudioSessionInterruptionReasonKey: AVAudioSession.InterruptionReason.builtInMicMuted.rawValue,
      ]
    )
    center.post(
      name: interruption,
      object: session,
      userInfo: [
        AVAudioSessionInterruptionTypeKey: ended,
        AVAudioSessionInterruptionOptionKey: AVAudioSession.InterruptionOptions.shouldResume.rawValue,
      ]
    )
    center.post(
      name: AVAudioSession.routeChangeNotification,
      object: session,
      userInfo: [AVAudioSessionRouteChangeReasonKey: AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue]
    )
    center.post(
      name: AVAudioSession.routeChangeNotification,
      object: session,
      userInfo: [AVAudioSessionRouteChangeReasonKey: AVAudioSession.RouteChangeReason.override.rawValue]
    )
    center.post(name: AVAudioSession.mediaServicesWereResetNotification, object: session)

    #expect(
      observer.events == [
        .interruptionBegan(.default),
        .interruptionBegan(.builtInMicMuted),
        .interruptionEnded(shouldResume: true),
        .routeChanged(.oldDeviceUnavailable),
        .routeChanged(.other),
        .servicesReset,
      ]
    )
    withExtendedLifetime(source) {}
    use.end()
  }

  @Test
  func testInterruptionFansOutToAllObservers() {
    let other = RecordingObserver()
    let otherRegistration = manager.addObserver(other)
    let use = manager.beginUse(client: "a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: true)

    let expected: [RecordingObserver.Event] = [.interruptionBegan(.default), .interruptionEnded(shouldResume: true)]
    #expect(observer.events == expected)
    #expect(other.events == expected)
    use.end()
    otherRegistration.remove()
  }

  @Test
  func testFailedResumeActivationStillReleases() {
    let use = manager.beginUse(client: "a")
    manager.suspendWrites(reason: "call")
    backend.failActivation(with: NSError(domain: NSOSStatusErrorDomain, code: 561_017_449))
    manager.resumeWrites()
    backend.failActivation(with: nil)
    use.end()
    scheduler.advance(milliseconds: 1000)

    #expect(backend.calls.last == .deactivate(notifyingOthers: true))
  }

  @Test
  func testInterruptionEndedReactivatesOnlyWhenItShouldResume() {
    let use = manager.beginUse(client: "a")
    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: false)
    #expect(backend.count(.activate) == 1)

    manager.coordinator.interruptionBegan(reason: .default)
    manager.coordinator.interruptionEnded(shouldResume: true)
    #expect(backend.count(.activate) == 2)
    use.end()
  }

  @Test
  func testMediaServicesResetRestoresState() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .duckOthers))
    let requirements = SessionRequirements(mode: .spokenAudio)
    let use = manager.beginUse(client: "a", requirements: requirements)
    #expect(backend.calls == [.configure(resolved([requirements])), .activate])

    backend.resetMediaServices()
    manager.coordinator.mediaServicesWereReset()

    #expect(
      backend.calls == [
        .configure(resolved([requirements])), .activate, .configure(resolved([requirements])), .activate,
      ]
    )
    #expect(backend.live == resolved([requirements]).configuration)
    #expect(observer.events == [.servicesReset])
    use.end()
  }

  @Test
  func testDeactivateFailureIsLoggedAndRetried() throws {
    let lines = Box<[String]>([])
    let manager = MediaSessionManager(backend: backend, scheduler: scheduler, nowPlayingCenter: FakeNowPlayingCenter())
    {
      line in
      lines.mutate { $0.append(line) }
    }
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMix))
    backend.failNextDeactivation(with: NSError(domain: NSOSStatusErrorDomain, code: 560_030_580))

    manager.beginUse(client: "a").end()
    scheduler.advance(milliseconds: 1000)
    #expect(deactivations == 1)
    #expect(lines.value.count == 1)
    #expect(lines.value.first?.contains("560030580") == true)

    manager.beginUse(client: "b").end()
    #expect(backend.count(.activate) == 2)
    scheduler.advance(milliseconds: 1000)
    #expect(deactivations == 2)

    manager.beginUse(client: "c").end()
    #expect(backend.count(.activate) == 3)
  }

  @Test
  func testEnteringForegroundReactivatesTheSession() throws {
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .mixWithOthers))
    let center = NotificationCenter()
    let source = SystemEventSource(coordinator: manager.coordinator, center: center, session: .sharedInstance())
    manager.beginUse(client: "a").end()

    center.post(name: UIApplication.willEnterForegroundNotification, object: nil)
    #expect(backend.count(.activate) == 1)
    let use = manager.beginUse(client: "b")
    #expect(backend.count(.activate) == 2)

    center.post(name: UIApplication.willEnterForegroundNotification, object: nil)
    #expect(backend.count(.activate) == 3)

    manager.coordinator.interruptionBegan(reason: .default)
    center.post(name: UIApplication.willEnterForegroundNotification, object: nil)
    #expect(backend.count(.activate) == 3)
    withExtendedLifetime(source) {}
    use.end()
  }

  @Test
  func testCategoryChangeWritesOnlyWhenLiveSessionDiffers() {
    let use = manager.beginUse(client: "a")
    manager.coordinator.routeChanged(.categoryChange)
    #expect(configures == 1)

    backend.live = SessionConfiguration(category: .ambient)
    manager.coordinator.routeChanged(.categoryChange)
    #expect(configures == 2)
    #expect(backend.live == resolved().configuration)

    backend.live = SessionConfiguration(category: .ambient)
    manager.coordinator.routeChanged(.categoryChange)
    #expect(configures == 2)

    use.update(SessionRequirements())
    #expect(configures == 3)
    #expect(
      observer.events == [
        .routeChanged(.categoryChange), .routeChanged(.categoryChange), .routeChanged(.categoryChange),
      ]
    )
    use.end()
  }
}
