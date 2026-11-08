import AVFoundation
import Foundation
import Testing

@testable import ExpoMediaSession

@Suite("SessionEventProperties")
struct SessionEventPropertyTests {
  @Test
  func testSessionEventsKeepTheirInvariants() throws {
    var failures: [String] = []
    for seed in 0..<PropertyRun.seeds {
      let run = try PropertyRun(seed: UInt64(seed))
      if let failure = try run.play() {
        failures.append("seed \(seed): \(failure)\n  steps: \(run.steps.joined(separator: ", "))")
      }
    }
    #expect(
      failures.isEmpty,
      "\(failures.count) of \(PropertyRun.seeds) seeds failed\n\(failures.prefix(3).joined(separator: "\n"))"
    )
  }
}

private struct SeededGenerator: RandomNumberGenerator {
  var state: UInt64

  mutating func next() -> UInt64 {
    state &+= 0x9E37_79B9_7F4A_7C15
    var value = state
    value = (value ^ (value >> 30)) &* 0xBF58_476D_1CE4_E5B9
    value = (value ^ (value >> 27)) &* 0x94D0_49BB_1331_11EB
    return value ^ (value >> 31)
  }
}

private final class EndedObserver: MediaSessionObserver, @unchecked Sendable {
  private let coordinator: SessionCoordinator
  private(set) var resumesWithoutUses = 0

  init(coordinator: SessionCoordinator) {
    self.coordinator = coordinator
  }

  func mediaSessionInterruptionEnded(shouldResume: Bool) {
    if shouldResume && coordinator.useCount == 0 {
      resumesWithoutUses += 1
    }
  }
}

private final class PropertyRun {
  static let seeds = 1000
  static let stepCount = 30

  private var random: SeededGenerator
  private let scheduler = ManualScheduler()
  private let backend = FakeSessionBackend()
  private let manager: MediaSessionManager
  private let observer: EndedObserver
  private let registration: ObserverRegistration
  private var uses: [SessionUse] = []
  private var suspendDepth = 0
  private var now = 0
  private var idleSince = 0
  private var notificationWrites = 0
  private(set) var steps: [String] = []

  init(seed: UInt64) throws {
    random = SeededGenerator(state: seed)
    manager = MediaSessionManager(backend: backend, scheduler: scheduler)
    observer = EndedObserver(coordinator: manager.coordinator)
    registration = manager.addObserver(observer)
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMix))
  }

  private var configures: Int {
    backend.calls.filter {
      if case .configure = $0 {
        return true
      }
      return false
    }.count
  }

  func play() throws -> String? {
    for _ in 0..<Self.stepCount {
      let roll = Int.random(in: 0..<100, using: &random)
      let reactivates = (48..<58).contains(roll) || (61..<73).contains(roll)
      let failsActivation = Int.random(in: 0..<(reactivates ? 2 : 10), using: &random) == 0
      let failsConfiguration = Int.random(in: 0..<10, using: &random) == 0
      backend.failActivation(with: failsActivation ? NSError(domain: NSOSStatusErrorDomain, code: 561_017_449) : nil)
      backend.failConfiguration(with: failsConfiguration ? NSError(domain: NSOSStatusErrorDomain, code: -50) : nil)
      let suffix = (failsActivation ? "!activate" : "") + (failsConfiguration ? "!configure" : "")
      let configuresBefore = configures
      let kind = try step(roll, suffix: suffix)

      if kind == .categoryChange {
        notificationWrites += configures - configuresBefore
        if notificationWrites > 1 {
          return "consecutive category changes wrote the configuration \(notificationWrites) times"
        }
      } else if kind != .passive {
        notificationWrites = 0
      }
      if let violation = violation() {
        return violation
      }
    }
    backend.failActivation(with: nil)
    backend.failConfiguration(with: nil)
    steps.append("endAll, resumeAll, advance(1s)")
    for use in uses {
      use.end()
    }
    uses.removeAll()
    for _ in 0..<suspendDepth {
      manager.resumeWrites()
    }
    suspendDepth = 0
    _ = violation()
    scheduler.advance(milliseconds: 1000)
    now += 1000
    return violation()
  }

  private func violation() -> String? {
    if uses.isEmpty && suspendDepth == 0 {
      idleSince = min(idleSince, now)
    } else {
      idleSince = Int.max
    }
    if now - idleSince >= 1000 && manager.coordinator.lastGood?.interruptionMode != .mixWithOthers
      && backend.isActive
    {
      return "the session is still active 1 s after the last use ended"
    }
    if observer.resumesWithoutUses > 0 {
      return "interruptionEnded(shouldResume: true) was sent with no uses"
    }
    return nil
  }

  private enum StepKind {
    case client
    case passive
    case categoryChange
  }

  private func step(_ roll: Int, suffix: String) throws -> StepKind {
    let coordinator = manager.coordinator
    switch roll {
    case 0..<12:
      let requirements = randomRequirements()
      steps.append("begin(\(label(requirements)))\(suffix)")
      uses.append(manager.beginUse(client: "u\(steps.count)", requirements: requirements))
    case 12..<28:
      guard !uses.isEmpty else {
        steps.append("end(none)")
        return .client
      }
      let index = Int.random(in: 0..<uses.count, using: &random)
      steps.append("end(#\(index))\(suffix)")
      uses.remove(at: index).end()
    case 28..<34:
      guard !uses.isEmpty else {
        steps.append("update(none)")
        return .client
      }
      let index = Int.random(in: 0..<uses.count, using: &random)
      let requirements = randomRequirements()
      steps.append("update(#\(index), \(label(requirements)))\(suffix)")
      uses[index].update(requirements)
    case 34..<40:
      let mode = [InterruptionMode.mixWithOthers, .doNotMix, .duckOthers].randomElement(using: &random)!
      steps.append("setPolicy(\(mode))\(suffix)")
      try manager.setPolicy(AudioPolicyUpdate(interruptionMode: mode))
    case 40..<48:
      steps.append("suspend")
      suspendDepth += 1
      manager.suspendWrites(reason: "s")
    case 48..<58:
      steps.append("resume\(suffix)")
      suspendDepth = max(0, suspendDepth - 1)
      manager.resumeWrites()
    case 58..<61:
      steps.append("interruptionBegan")
      backend.interrupt()
      coordinator.interruptionBegan(reason: .default)
      return .passive
    case 61..<69:
      let shouldResume = Bool.random(using: &random)
      steps.append("interruptionEnded(\(shouldResume))\(suffix)")
      coordinator.interruptionEnded(shouldResume: shouldResume)
    case 69..<73:
      steps.append("reset\(suffix)")
      backend.resetMediaServices()
      coordinator.mediaServicesWereReset()
    case 73..<82:
      let category = [AVAudioSession.Category.ambient, .playback, .soloAmbient].randomElement(using: &random)!
      steps.append("categoryChange(\(category.rawValue))\(suffix)")
      backend.live = SessionConfiguration(category: category)
      coordinator.routeChanged(.categoryChange)
      return .categoryChange
    default:
      steps.append("advance(1s)")
      scheduler.advance(milliseconds: 1000)
      now += 1000
      return .passive
    }
    return .client
  }

  private func randomRequirements() -> SessionRequirements {
    SessionRequirements(
      mixing: [nil, nil, MixingRequirement.mixWithOthers, .duckOthers, .doNotMix].randomElement(using: &random)!,
      mode: [nil, AVAudioSession.Mode.spokenAudio, .moviePlayback].randomElement(using: &random)!
    )
  }

  private func label(_ requirements: SessionRequirements) -> String {
    [requirements.mixing.map { "\($0)" }, requirements.mode?.rawValue].compactMap { $0 }.joined(separator: " ")
  }
}
