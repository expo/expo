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
  static let lateOwner = 3

  private struct Live {
    let owner: Int
    let claim: any NowPlayingClaim
    var info: NowPlayingInfo
    var commands: Set<RemoteCommandKind>
    var wasPlaying: Bool
    var pausedByTakeover = false
  }

  private var random: NowPlayingGenerator
  private let scheduler = ManualScheduler()
  private let center = FakeNowPlayingCenter()
  private let manager: MediaSessionManager
  private let hold: (any SessionHold)?
  private var uses: [(use: any SessionUse, strict: Bool)] = []
  private var policyMixes = false
  private let owners = (0..<4).map { FakeNowPlayingOwner("o\($0)", mediaType: $0 % 2 == 0 ? .audio : .video) }
  private var live: [Live] = []
  private var stale: [any NowPlayingClaim] = []
  private var seen = [Int](repeating: 0, count: 4)
  private var offers = 0
  private(set) var steps: [String] = []

  init(seed: UInt64) throws {
    random = NowPlayingGenerator(state: seed)
    manager = MediaSessionManager(backend: FakeSessionBackend(), scheduler: scheduler, nowPlayingCenter: center)
    try manager.setPolicy(AudioPolicyUpdate(interruptionMode: .doNotMix))
    hold = seed % 2 == 0 ? manager.hold(client: "property") : nil
    owners[Self.lateOwner].pausesLate = true
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
      let isPlaying = Int.random(in: 0..<3, using: &random) > 0
      let info = NowPlayingInfo(title: "o\(index)#\(offers)", isLiveStream: Bool.random(using: &random))
      let commands = Set(Self.allCommands.filter { _ in Bool.random(using: &random) })
      steps.append("offer(o\(index), \(isPlaying ? "playing" : "paused"), \(commands.count) commands)")
      owner.isPlaying = isPlaying
      let topPlays = top.map { $0.owner != index && owners[$0.owner].isPlaying } ?? false
      var expected: [Int: [FakeNowPlayingOwner.Event]] = [:]
      if isPlaying && topPlays && !mixes {
        expected[live[live.count - 1].owner] = [.pausedForTakeover]
        live[live.count - 1].pausedByTakeover = true
        live[live.count - 1].wasPlaying = true
      }
      if let current {
        stale.append(live.remove(at: current).claim)
      }
      let claim = manager.offerNowPlaying(owner, info: info, commands: commands)
      let entry = Live(owner: index, claim: claim, info: info, commands: commands, wasPlaying: isPlaying)
      if !isPlaying && topPlays {
        var position = live.count - 1
        while position > 0 && live[position - 1].pausedByTakeover {
          position -= 1
        }
        live.insert(entry, at: position)
      } else {
        live.append(entry)
      }
      return expectEvents(expected)
    case 25..<35:
      guard let current else {
        return nil
      }
      offers += 1
      steps.append("update(o\(index))")
      live[current].info = NowPlayingInfo(title: "o\(index)#\(offers)")
      return update(at: current)
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
    case 55..<60:
      guard !stale.isEmpty else {
        return nil
      }
      steps.append("withdrawStale")
      stale.remove(at: Int.random(in: 0..<stale.count, using: &random)).withdraw()
    case 60..<68:
      guard let current else {
        return nil
      }
      let isLatePause = index == Self.lateOwner && live[current].pausedByTakeover
      steps.append(isLatePause ? "latePause(o\(index))" : "userPause(o\(index))")
      owner.isPlaying = false
      return update(at: current)
    case 68..<77:
      guard let current else {
        return nil
      }
      steps.append("userPlay(o\(index))")
      owner.isPlaying = true
      return update(at: current)
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

  private func update(at index: Int) -> String? {
    let isPlaying = owners[live[index].owner].isPlaying
    let startedPlaying = isPlaying && !live[index].wasPlaying
    if startedPlaying {
      live[index].pausedByTakeover = false
    }
    live[index].wasPlaying = isPlaying
    var expected: [Int: [FakeNowPlayingOwner.Event]] = [:]
    let claim = live[index].claim
    if startedPlaying && index != live.count - 1 {
      let entry = live.remove(at: index)
      if let top, owners[top.owner].isPlaying, !mixes {
        expected[top.owner] = [.pausedForTakeover]
        live[live.count - 1].pausedByTakeover = true
        live[live.count - 1].wasPlaying = true
      }
      live.append(entry)
    }
    claim.update(live.first { $0.claim === claim }!.info)
    return expectEvents(expected)
  }

  private func withdraw(at index: Int, ending: Bool) -> String? {
    let wasTop = index == live.count - 1
    var claim: (any NowPlayingClaim)? = live[index].claim
    live.remove(at: index)
    var expected: [Int: [FakeNowPlayingOwner.Event]] = [:]
    if wasTop, let top, top.pausedByTakeover {
      expected[top.owner] = [.resumedAfterTakeover]
      live[live.count - 1].pausedByTakeover = false
    }
    if ending {
      claim?.withdraw()
    }
    claim = nil
    return expectEvents(expected)
  }

  private func expectEvents(_ expected: [Int: [FakeNowPlayingOwner.Event]]) -> String? {
    for index in owners.indices {
      let owner = owners[index]
      let new = Array(owner.events.dropFirst(seen[index]).filter { !$0.isHandled })
      seen[index] = owner.events.count
      let wanted = expected[index] ?? []
      if new != wanted {
        return "o\(index) got \(new), expected \(wanted) (mix: \(mixes))"
      }
    }
    return nil
  }

  private func check() -> String? {
    for index in owners.indices {
      let owner = owners[index]
      let new = owner.events.dropFirst(seen[index]).filter { !$0.isHandled }
      if !new.isEmpty {
        return "o\(index) got \(new) outside a takeover or a return"
      }
      seen[index] = owner.events.count
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
