import AVFoundation
import ExpoMediaSession
import Testing

@testable import ExpoVideo

@Suite("VideoSessionState")
struct VideoSessionStateTests {
  private func makeState(_ change: (inout VideoSessionState) -> Void) -> VideoSessionState {
    var state = VideoSessionState()
    change(&state)
    return state
  }

  private func requirements(_ mixing: MixingRequirement) -> SessionRequirements {
    return SessionRequirements(mixing: mixing, mode: .moviePlayback)
  }

  // MARK: - Mixing

  @Test
  func `mixWithOthers always mixes`() {
    let state = makeState {
      $0.audioMixingMode = .mixWithOthers
      $0.setPlaying(true)
    }

    #expect(state.mixing == .mixWithOthers)
  }

  @Test
  func `duckOthers ducks only while audible`() {
    let audible = makeState {
      $0.audioMixingMode = .duckOthers
      $0.setPlaying(true)
    }
    let muted = makeState {
      $0.audioMixingMode = .duckOthers
      $0.setPlaying(true)
      $0.isMuted = true
    }
    let paused = makeState {
      $0.audioMixingMode = .duckOthers
    }

    #expect(audible.mixing == .duckOthers)
    #expect(muted.mixing == .mixWithOthers)
    #expect(paused.mixing == .mixWithOthers)
  }

  @Test
  func `auto does not mix while audible`() {
    let state = makeState {
      $0.setPlaying(true)
    }

    #expect(state.mixing == .doNotMix)
  }

  @Test
  func `auto mixes while muted`() {
    let state = makeState {
      $0.setPlaying(true)
      $0.isMuted = true
    }

    #expect(state.mixing == .mixWithOthers)
  }

  @Test
  func `auto does not mix when now playing is shown`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.isMuted = true
      $0.showNowPlayingNotification = true
    }

    #expect(state.mixing == .doNotMix)
  }

  @Test
  func `auto does not mix while muted when another player holds now playing`() {
    let state = makeState {
      $0.setPlaying(true)
      $0.isMuted = true
      $0.anotherPlayerWantsNowPlaying = true
    }

    #expect(state.mixing == .doNotMix)
  }

  @Test
  func `mixWithOthers mixes when another player holds now playing`() {
    let state = makeState {
      $0.audioMixingMode = .mixWithOthers
      $0.setPlaying(true)
      $0.anotherPlayerWantsNowPlaying = true
    }

    #expect(state.mixing == .mixWithOthers)
  }

  @Test
  func `doNotMix never mixes`() {
    let state = makeState {
      $0.audioMixingMode = .doNotMix
      $0.isMuted = true
    }

    #expect(state.mixing == .doNotMix)
  }

  @Test
  func `requirements use the movie playback mode`() {
    let state = makeState {
      $0.audioMixingMode = .doNotMix
    }

    #expect(state.requirements == SessionRequirements(mixing: .doNotMix, mode: .moviePlayback))
  }

  // MARK: - Use and claim

  @Test
  func `a playing player wants a use`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    #expect(state.wantsUse)
    #expect(!state.wantsNowPlaying)
  }

  @Test
  func `a playing player without an item wants no use`() {
    let state = makeState {
      $0.setPlaying(true)
    }

    #expect(!state.wantsUse)
  }

  @Test
  func `a never-played player with now playing wants no use and no claim`() {
    let state = makeState {
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
    }

    #expect(!state.wantsUse)
    #expect(!state.wantsNowPlaying)
  }

  @Test
  func `a paused player that played keeps its claim and releases its use`() {
    let state = makeState {
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.setPlaying(false)
    }

    #expect(!state.wantsUse)
    #expect(state.wantsNowPlaying)
  }

  @Test
  func `a paused player without now playing wants no use`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.setPlaying(false)
    }

    #expect(!state.wantsUse)
  }

  @Test
  func `a new item on a paused player that played keeps the claim`() {
    let state = makeState {
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.setPlaying(false)
      $0.setHasItem(true)
    }

    #expect(state.wantsNowPlaying)
    #expect(!state.wantsUse)
  }

  @Test
  func `a play request without an item does not count as played`() {
    let state = makeState {
      $0.showNowPlayingNotification = true
      $0.setPlaying(true)
      $0.setPlaying(false)
      $0.setHasItem(true)
    }

    #expect(!state.wantsNowPlaying)
  }

  @Test
  func `a new item on a playing player keeps the claim`() {
    let state = makeState {
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.setHasItem(true)
    }

    #expect(state.wantsNowPlaying)
  }

  @Test
  func `removing the item drops the claim`() {
    let state = makeState {
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.setPlaying(false)
      $0.setHasItem(false)
      $0.setHasItem(true)
    }

    #expect(!state.wantsNowPlaying)
  }

  // MARK: - Session use action

  @Test
  func `begins a use when one is wanted and none is live`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    let action = sessionUseAction(isUseLive: false, applied: nil, state: state)

    #expect(action == .begin(requirements(.doNotMix)))
  }

  @Test
  func `does nothing when the live use already has the requirements`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    let action = sessionUseAction(isUseLive: true, applied: requirements(.doNotMix), state: state)

    #expect(action == .none)
  }

  @Test
  func `updates the live use when muting changes the requirements`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.isMuted = true
    }

    let action = sessionUseAction(isUseLive: true, applied: requirements(.doNotMix), state: state)

    #expect(action == .update(requirements(.mixWithOthers)))
  }

  @Test
  func `ends the live use when none is wanted`() {
    let action = sessionUseAction(isUseLive: true, applied: requirements(.doNotMix), state: VideoSessionState())

    #expect(action == .end)
  }

  @Test
  func `does nothing when no use is wanted and none is live`() {
    let action = sessionUseAction(isUseLive: false, applied: nil, state: VideoSessionState())

    #expect(action == .none)
  }

  // MARK: - Now Playing claim action

  @Test
  func `offers when a claim is wanted and none exists`() {
    let state = makeState {
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    #expect(nowPlayingClaimAction(hasClaim: false, state: state) == .offer)
  }

  @Test
  func `withdraws when the claim is no longer wanted`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    #expect(nowPlayingClaimAction(hasClaim: true, state: state) == .withdraw)
  }

  @Test
  func `keeps an existing wanted claim`() {
    let state = makeState {
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    #expect(nowPlayingClaimAction(hasClaim: true, state: state) == .none)
  }

  // MARK: - Takeover

  @Test
  func `a takeover pause stays set while the player is paused`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.isPausedForTakeover = true
      $0.setPlaying(false)
    }

    #expect(state.isPausedForTakeover)
  }

  @Test
  func `a play clears the takeover pause`() {
    let state = makeState {
      $0.setHasItem(true)
      $0.isPausedForTakeover = true
      $0.setPlaying(true)
    }

    #expect(!state.isPausedForTakeover)
  }

  // MARK: - Manual audio session

  @Test
  func `a player that does not manage the audio session wants no use`() {
    let state = makeState {
      $0.manageAudioSession = false
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    #expect(!state.wantsUse)
    #expect(sessionUseAction(isUseLive: true, applied: state.requirements, state: state) == .end)
  }

  @Test
  func `a player that does not manage the audio session keeps its Now Playing claim`() {
    let state = makeState {
      $0.manageAudioSession = false
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    #expect(state.wantsNowPlaying)
    #expect(!state.asksOtherPlayersNotToMix)
  }

  @Test
  func `Now Playing conflicts with a manual session that mixes`() {
    let state = makeState {
      $0.manageAudioSession = false
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    #expect(sessionConflicts(state: state, policyMode: .mixWithOthers) == [.nowPlayingWithMixingSession])
    #expect(sessionConflicts(state: state, policyMode: .duckOthers) == [.nowPlayingWithMixingSession])
    #expect(sessionConflicts(state: state, policyMode: .doNotMix).isEmpty)
    #expect(sessionConflicts(state: state, policyMode: .doNotMixPersistent).isEmpty)
  }

  @Test
  func `an audio mixing mode conflicts with a manual session`() {
    let state = makeState {
      $0.manageAudioSession = false
      $0.audioMixingMode = .doNotMix
    }

    #expect(sessionConflicts(state: state, policyMode: .doNotMix) == [.audioMixingModeIgnored])
  }

  @Test
  func `a player that manages the audio session has no conflicts`() {
    let state = makeState {
      $0.audioMixingMode = .mixWithOthers
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    #expect(sessionConflicts(state: state, policyMode: .mixWithOthers).isEmpty)
  }

  @Test
  func `reports one time when a manual player and a managed player are in use together`() {
    var mix = SessionManagementMix<Int>()
    let manual = makeState { $0.manageAudioSession = false }
    let managedInUse = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
    }

    let reports = [
      mix.shouldWarn(afterUpdating: 1, to: manual),
      mix.shouldWarn(afterUpdating: 2, to: VideoSessionState()),
      mix.shouldWarn(afterUpdating: 2, to: managedInUse),
      mix.shouldWarn(afterUpdating: 2, to: managedInUse)
    ]

    #expect(reports == [false, false, true, false])
  }

  @Test
  func `does not report again when the managed player pauses and plays`() {
    var mix = SessionManagementMix<Int>()
    let managedInUse = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
    }
    let managedPaused = makeState {
      $0.setHasItem(true)
    }
    let reports = [
      mix.shouldWarn(afterUpdating: 1, to: makeState { $0.manageAudioSession = false }),
      mix.shouldWarn(afterUpdating: 2, to: managedInUse),
      mix.shouldWarn(afterUpdating: 2, to: managedPaused),
      mix.shouldWarn(afterUpdating: 2, to: managedInUse)
    ]

    #expect(reports == [false, true, false, false])
  }

  @Test
  func `reports again after all the manual players are released`() {
    var mix = SessionManagementMix<Int>()
    let manual = makeState { $0.manageAudioSession = false }
    let managedInUse = makeState {
      $0.setHasItem(true)
      $0.setPlaying(true)
    }
    let firstReports = [
      mix.shouldWarn(afterUpdating: 1, to: manual),
      mix.shouldWarn(afterUpdating: 2, to: managedInUse)
    ]
    mix.remove(1)
    let reportAfterRelease = mix.shouldWarn(afterUpdating: 3, to: manual)

    #expect(firstReports == [false, true])
    #expect(reportAfterRelease)
  }

  @Test
  func `a managed player that wants Now Playing counts as in use`() {
    var mix = SessionManagementMix<Int>()
    let managedOwner = makeState {
      $0.showNowPlayingNotification = true
      $0.setHasItem(true)
      $0.setPlaying(true)
      $0.setPlaying(false)
    }

    let reports = [
      mix.shouldWarn(afterUpdating: 1, to: managedOwner),
      mix.shouldWarn(afterUpdating: 2, to: makeState { $0.manageAudioSession = false })
    ]

    #expect(reports == [false, true])
  }

  // MARK: - Failure description

  @Test
  func `the failure description keeps the text of a module exception`() {
    let error = MediaSessionException("iOS rejected category AVAudioSessionCategoryPlayback")

    #expect(VideoMediaSessionClient.failureDescription(error).contains("iOS rejected category AVAudioSessionCategoryPlayback"))
  }
}
