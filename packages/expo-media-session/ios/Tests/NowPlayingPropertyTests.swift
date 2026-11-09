import Foundation
import Testing

@testable import ExpoMediaSession

@Suite("NowPlayingProperties")
struct NowPlayingPropertyTests {
  @Test
  func testNowPlayingStackKeepsItsInvariants() throws {
    var failures: [String] = []
    for seed in 0..<NowPlayingRun.seeds {
      let run = try NowPlayingRun(seed: UInt64(seed))
      if let failure = run.play() {
        failures.append("seed \(seed): \(failure)\n  steps: \(run.steps.joined(separator: ", "))")
      }
    }
    #expect(
      failures.isEmpty,
      "\(failures.count) of \(NowPlayingRun.seeds) seeds failed\n\(failures.prefix(3).joined(separator: "\n"))"
    )
  }
}

private struct NowPlayingGenerator: RandomNumberGenerator {
  var state: UInt64

  mutating func next() -> UInt64 {
    state &+= 0x9E37_79B9_7F4A_7C15
    var value = state
    value = (value ^ (value >> 30)) &* 0xBF58_476D_1CE4_E5B9
    value = (value ^ (value >> 27)) &* 0x94D0_49BB_1331_11EB
    return value ^ (value >> 31)
  }
}

private final class NowPlayingRun {
  static let seeds = 1000
  static let stepCount = 40
  static let allCommands: [RemoteCommandKind] = [.play, .pause, .togglePlayPause, .seek, .skipForward, .nextTrack]

  private struct Live {
    let owner: Int
    let claim: NowPlayingClaim
    var info: NowPlayingInfo
    var commands: Set<RemoteCommandKind>
  }

  private var random: NowPlayingGenerator
  private let scheduler = ManualScheduler()
  private let center = FakeNowPlayingCenter()
  private let manager: MediaSessionManager
  private let hold: SessionHold?
  private var uses: [(use: SessionUse, strict: Bool)] = []
  private var policyMixes = false
  private let owners = (0..<4).map { FakeNowPlayingOwner("o\($0)", mediaType: $0 % 2 == 0 ? .audio : .video) }
  private var live: [Live] = []
  private var stale: [NowPlayingClaim] = []
  private var outstanding = [Bool](repeating: false, count: 4)
  private var seen = [Int](repeating: 0, count: 4)
  private var offers = 0
  private(set) var steps: [String] = []

  init(seed: UInt64) throws {
    random = NowPlayingGenerator(state: seed)
    manager = MediaSessionManager(backend: FakeSessionBackend(), scheduler: scheduler, nowPlayingCenter: center)
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMix))
    hold = seed % 2 == 0 ? manager.hold(client: "property") : nil
  }

  private var mixes: Bool {
    policyMixes && !uses.contains { $0.strict }
  }

  private var top: Live? {
    live.last
  }

  func play() -> String? {
    for _ in 0..<Self.stepCount {
      if let violation = step() ?? check() {
        return violation
      }
    }
    while let entry = live.last {
      steps.append("end(o\(entry.owner))")
      if let violation = withdraw(at: live.count - 1, ending: true) ?? check() {
        return violation
      }
    }
    withExtendedLifetime((hold, uses.map(\.use))) {}
    return nil
  }

  private func step() -> String? {
    let roll = Int.random(in: 0..<100, using: &random)
    let index = Int.random(in: 0..<owners.count, using: &random)
    let owner = owners[index]
    let current = live.firstIndex { $0.owner == index }
    switch roll {
    case 0..<25:
      offers += 1
      let info = NowPlayingInfo(title: "o\(index)#\(offers)", isLiveStream: Bool.random(using: &random))
      let commands = Set(Self.allCommands.filter { _ in Bool.random(using: &random) })
      steps.append("offer(o\(index), \(commands.count) commands)")
      let previous = top
      let previousWasPlaying = previous.map { owners[$0.owner].isPlaying } ?? false
      if let current {
        stale.append(live.remove(at: current).claim)
      }
      outstanding[index] = false
      owner.isPlaying = true
      let claim = manager.offerNowPlaying(owner, info: info, commands: commands)
      if let previous, previous.owner != index {
        if let violation = expectTakeover(of: previous.owner, wasPlaying: previousWasPlaying) {
          return violation
        }
      }
      live.append(Live(owner: index, claim: claim, info: info, commands: commands))
    case 25..<35:
      guard let current else {
        return nil
      }
      offers += 1
      let info = NowPlayingInfo(title: "o\(index)#\(offers)")
      steps.append("update(o\(index))")
      live[current].info = info
      live[current].claim.update(info)
    case 35..<45:
      guard let current else {
        return nil
      }
      steps.append("end(o\(index))")
      return withdraw(at: current, ending: true)
    case 45..<55:
      guard let current else {
        return nil
      }
      steps.append("release(o\(index))")
      return withdraw(at: current, ending: false)
    case 55..<62:
      guard !stale.isEmpty else {
        return nil
      }
      steps.append("withdrawStale")
      stale.remove(at: Int.random(in: 0..<stale.count, using: &random)).withdraw(.ended)
    case 62..<72:
      guard let current else {
        return nil
      }
      steps.append("userPause(o\(index))")
      owner.isPlaying = false
      live[current].claim.update(live[current].info)
    case 72..<77:
      guard let top else {
        return nil
      }
      steps.append("userPlay(top o\(top.owner))")
      owners[top.owner].isPlaying = true
      outstanding[top.owner] = false
      top.claim.update(top.info)
    case 77..<92:
      let command = RemoteCommand(kind: Self.allCommands.randomElement(using: &random)!)
      steps.append("command(\(command.kind.rawValue))")
      let before = owners.map(\.handledCount)
      center.send(command)
      let after = owners.map(\.handledCount)
      let expected = owners.indices.map { index -> Int in
        guard let top, top.owner == index, Self.effective(top).contains(command.kind) else {
          return before[index]
        }
        return before[index] + 1
      }
      if after != expected {
        return "the command \(command.kind.rawValue) reached \(after) handlers, expected \(expected)"
      }
    case 92..<96:
      let strict = Bool.random(using: &random)
      steps.append(strict ? "beginUse(doNotMix)" : "beginUse")
      uses.append(
        (manager.beginUse(client: "u", requirements: SessionRequirements(mixing: strict ? .doNotMix : nil)), strict)
      )
    case 96..<98:
      guard !uses.isEmpty else {
        return nil
      }
      steps.append("endUse")
      uses.remove(at: Int.random(in: 0..<uses.count, using: &random)).use.end()
    default:
      policyMixes = Bool.random(using: &random)
      steps.append(policyMixes ? "policy(mix)" : "policy(doNotMix)")
      try? manager.setPolicy(AudioPolicyUpdate(interruptionMode: policyMixes ? .mixWithOthers : .doNotMix))
    }
    return nil
  }

  private func withdraw(at index: Int, ending: Bool) -> String? {
    let wasTop = index == live.count - 1
    var claim: NowPlayingClaim? = live[index].claim
    let owner = live.remove(at: index).owner
    if ending {
      claim?.withdraw(.ended)
    }
    claim = nil
    outstanding[owner] = false
    seen[owner] = owners[owner].events.count
    if wasTop, let top, outstanding[top.owner] {
      return expectResume(of: top.owner)
    }
    return nil
  }

  private func expectTakeover(of index: Int, wasPlaying: Bool) -> String? {
    let owner = owners[index]
    let new = Array(owner.events.dropFirst(seen[index]))
    seen[index] = owner.events.count
    let expected: [FakeNowPlayingOwner.Event] = wasPlaying && !mixes ? [.pausedForTakeover] : []
    if new != expected {
      return "o\(index) got \(new) on a takeover, expected \(expected) (mix: \(mixes))"
    }
    if !expected.isEmpty {
      if outstanding[index] {
        return "o\(index) was paused for a takeover twice without a resume"
      }
      outstanding[index] = true
    }
    return nil
  }

  private func expectResume(of index: Int) -> String? {
    let owner = owners[index]
    let new = Array(owner.events.dropFirst(seen[index]))
    seen[index] = owner.events.count
    outstanding[index] = false
    if new == [.resumedAfterTakeover] {
      return nil
    }
    return "o\(index) returned to the top with \(new), expected one resumeAfterTakeover"
  }

  private func check() -> String? {
    for index in owners.indices {
      let owner = owners[index]
      let new = owner.events.dropFirst(seen[index]).filter { !$0.isHandled }
      if !new.isEmpty {
        return "o\(index) got \(new) outside a takeover or a return"
      }
      seen[index] = owner.events.count
      if !live.contains(where: { $0.owner == index }) && outstanding[index] {
        return "o\(index) left the stack with a pending takeover"
      }
    }
    guard let top else {
      if center.state != nil || !center.targets.isEmpty || manager.nowPlayingOwnerID != nil {
        return "the stack is empty but the center still shows \(String(describing: center.state?.info.title))"
      }
      return nil
    }
    if manager.nowPlayingOwnerID != "o\(top.owner)" {
      return "the top is \(String(describing: manager.nowPlayingOwnerID)), expected o\(top.owner)"
    }
    if center.state?.info != top.info || center.targets != Self.effective(top) {
      return "the center shows \(String(describing: center.state?.info.title)), expected \(top.info.title ?? "")"
    }
    if center.state?.mediaType != owners[top.owner].mediaType {
      return "the center media type does not follow o\(top.owner)"
    }
    return nil
  }

  private static func effective(_ entry: Live) -> Set<RemoteCommandKind> {
    entry.info.isLiveStream ? entry.commands.subtracting([.seek]) : entry.commands
  }
}

extension FakeNowPlayingOwner.Event {
  fileprivate var isHandled: Bool {
    if case .handled = self {
      return true
    }
    return false
  }
}
