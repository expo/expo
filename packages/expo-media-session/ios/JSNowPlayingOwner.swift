import ExpoModulesCore

@SharedObject("NowPlayingOwner")
final class JSNowPlayingOwner: SharedObject {
  let mediaType: NowPlayingMediaType
  private let playing = Mutex(false)
  private let claim = Mutex<(any NowPlayingClaim)?>(nil)

  @Event
  var onCommand: (RemoteCommandEvent) -> Void

  @Event
  var onPauseForTakeover: () -> Void

  @Event
  var onResumeAfterTakeover: () -> Void

  init(mediaType: NowPlayingMediaType) {
    self.mediaType = mediaType
  }

  @JS
  func offer(_ info: NowPlayingInfoRecord, _ commands: [String], _ isPlaying: Bool) {
    playing.withLock { $0 = isPlaying }
    let offered = MediaSessionManager.shared.offerNowPlaying(self, info: info.info, commands: commandKinds(commands))
    let previous = claim.withLock { claim in
      defer { claim = offered }
      return claim
    }
    previous?.withdraw()
  }

  @JS
  func update(_ info: NowPlayingInfoRecord, _ commands: [String]?, _ isPlaying: Bool) {
    playing.withLock { $0 = isPlaying }
    claim.withLock { $0 }?.update(info.info, commands: commands.map(commandKinds))
  }

  @JS
  func withdraw() {
    withdrawClaim()
  }

  private func withdrawClaim() {
    let removed = claim.withLock { claim in
      defer { claim = nil }
      return claim
    }
    removed?.withdraw()
  }

  private func commandKinds(_ commands: [String]) -> Set<RemoteCommandKind> {
    Set(commands.map(RemoteCommandKind.init))
  }

  // MARK: - SharedObject

  override func sharedObjectDidRelease() {
    withdrawClaim()
  }
}

// MARK: - NowPlayingOwner

extension JSNowPlayingOwner: NowPlayingOwner {
  var isPlaying: Bool {
    playing.withLock { $0 }
  }

  func handle(_ command: RemoteCommand) {
    onCommand(RemoteCommandEvent(kind: command.kind.rawValue, value: command.value))
  }

  func pauseForTakeover() {
    onPauseForTakeover()
  }

  func resumeAfterTakeover() {
    onResumeAfterTakeover()
  }
}
