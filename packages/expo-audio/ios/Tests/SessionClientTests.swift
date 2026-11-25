import AVFoundation
import ExpoMediaSession
import ExpoModulesTestCore
import Testing

@testable import ExpoAudio
@testable import ExpoModulesCore

private final class SpyQueuePlayer: AVQueuePlayer {
  private(set) var pauseCalls = 0
  private(set) var playCalls = 0

  override func pause() {
    pauseCalls += 1
    super.pause()
  }

  override func playImmediately(atRate rate: Float) {
    playCalls += 1
    super.playImmediately(atRate: rate)
  }
}

@Suite("AudioPlayer session use")
struct AudioPlayerSessionUseTests {
  let session = FakeMediaSessionManager()

  private func makePlayer(items: [AVPlayerItem] = []) -> (AudioPlayer, SpyQueuePlayer) {
    let avPlayer = SpyQueuePlayer(items: items)
    return (AudioPlayer(avPlayer, interval: 500, session: session), avPlayer)
  }

  private func drain(_ player: AudioPlayer) {
    player.sessionUse.queue.sync {}
  }

  @Test
  func `play begins a use and pause ends it`() throws {
    let (player, _) = makePlayer()

    player.play()
    let use = try #require(session.uses.last)
    #expect(use.client.hasPrefix("expo-audio:player:"))
    #expect(!use.isEnded)

    player.pause()
    #expect(use.isEnded)
  }

  @Test
  func `play ends the previous use`() {
    let (player, _) = makePlayer()

    player.play()
    player.play()

    #expect(session.uses.count == 2)
    #expect(session.uses[0].isEnded)
    #expect(!session.uses[1].isEnded)
  }

  @Test
  func `play does nothing while audio is disabled`() {
    let (player, avPlayer) = makePlayer()
    player.canStartPlayback = { false }

    player.play()

    #expect(session.uses.isEmpty)
    #expect(avPlayer.playCalls == 0)
  }

  @Test
  func `a pause command pauses the player and keeps the use`() throws {
    let (player, avPlayer) = makePlayer()
    player.play()
    let use = try #require(session.uses.last)
    let pausesBefore = avPlayer.pauseCalls

    use.pause(reason: .interruption)
    drain(player)

    #expect(avPlayer.pauseCalls == pausesBefore + 1)
    #expect(!use.isEnded)

    let playsBefore = avPlayer.playCalls
    use.resume()
    drain(player)

    #expect(avPlayer.playCalls == playsBefore + 1)
  }

  @Test
  func `a resume after a user pause does not play`() throws {
    let (player, avPlayer) = makePlayer()
    player.play()
    let use = try #require(session.uses.last)
    player.pause()
    let playsBefore = avPlayer.playCalls

    use.resume()
    drain(player)

    #expect(avPlayer.playCalls == playsBefore)
  }

  @Test
  func `duck halves the volume and the end of the duck restores it`() throws {
    let (player, avPlayer) = makePlayer()
    avPlayer.volume = 0.8
    player.play()
    let use = try #require(session.uses.last)

    use.duck(true)
    drain(player)
    #expect(avPlayer.volume == 0.4)

    use.duck(false)
    drain(player)
    #expect(avPlayer.volume == 0.8)
  }

  @Test
  func `ending a ducked use restores the volume`() throws {
    let (player, avPlayer) = makePlayer()
    avPlayer.volume = 0.8
    player.play()
    try #require(session.uses.last).duck(true)
    drain(player)

    player.pause()

    #expect(avPlayer.volume == 0.8)
  }

  @Test
  func `playing again during a duck keeps one volume to restore`() throws {
    let (player, avPlayer) = makePlayer()
    avPlayer.volume = 0.8
    player.play()
    try #require(session.uses.last).duck(true)
    drain(player)

    player.play()
    let second = try #require(session.uses.last)
    second.duck(true)
    second.duck(false)
    drain(player)

    #expect(avPlayer.volume == 0.8)
  }

  @Test
  func `a failed activation pauses the player`() throws {
    let (player, avPlayer) = makePlayer()
    player.play()
    let use = try #require(session.uses.last)
    let pausesBefore = avPlayer.pauseCalls

    use.endByModule(error: AudioRecordingException("test"))
    drain(player)

    #expect(avPlayer.pauseCalls == pausesBefore + 1)
  }

  @Test
  func `the end of playback ends the use`() throws {
    let item = AVPlayerItem(url: URL(string: "https://example.invalid/track.mp3")!)
    let (player, _) = makePlayer(items: [item])
    player.play()
    let use = try #require(session.uses.last)

    NotificationCenter.default.post(name: .AVPlayerItemDidPlayToEndTime, object: item)

    #expect(use.isEnded)
  }

  @Test
  func `keeping the session active takes one hold until release`() throws {
    let (player, _) = makePlayer()
    player.keepAudioSessionActive = true

    player.play()
    player.pause()
    player.play()

    #expect(session.holds.count == 1)
    player.releaseHold()
    #expect(session.holds[0].isReleased)
  }

  @Test
  func `a change of background playback updates the live use`() throws {
    let (player, _) = makePlayer()
    player.play()

    player.setContinuesInBackground(true)

    #expect(try #require(session.uses.last).requirements.continuesInBackground)
  }
}

@Suite("AudioPlaylist session use")
struct AudioPlaylistSessionUseTests {
  let session = FakeMediaSessionManager()

  @Test
  func `play begins a use and pause ends it`() throws {
    let playlist = AudioPlaylist(AVQueuePlayer(), sources: [], items: [], interval: 500, loopMode: .none, session: session)

    playlist.play()
    let use = try #require(session.uses.last)
    #expect(use.client.hasPrefix("expo-audio:playlist:"))

    playlist.pause()
    #expect(use.isEnded)
  }
}

@Suite("AudioModule session client", .serialized)
@JavaScriptActor
struct AudioModuleSessionClientTests {
  let appContext: AppContext
  let runtime: ExpoRuntime
  let module: AudioModule
  let session = FakeMediaSessionManager()

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    module = AudioModule(appContext: appContext)
    module.session = session
    appContext.moduleRegistry.register(module: module, name: nil)
  }

  @Test
  func `setAudioModeAsync sends the policy to the session`() async throws {
    try await runtime.execute {
      _ = try await runtime.evalAsync(
        "expo.modules.ExpoAudio.setAudioModeAsync({ interruptionMode: 'doNotMix', allowsRecording: true })"
      )
    }

    #expect(session.policy.interruptionMode == .doNotMix)
    #expect(session.policy.allowsRecording)
  }

  @Test
  func `a player use continues in the background when the mode allows it`() async throws {
    try await runtime.execute {
      _ = try await runtime.evalAsync("expo.modules.ExpoAudio.setAudioModeAsync({ shouldPlayInBackground: true })")
      _ = try runtime.eval("new expo.modules.ExpoAudio.AudioPlayer(null, 500, false, 0, false).play()")
    }

    #expect(try #require(session.uses.last).requirements.continuesInBackground)
  }

  @Test
  func `a mode change updates the live player use`() async throws {
    try await runtime.execute {
      _ = try runtime.eval("globalThis.player = new expo.modules.ExpoAudio.AudioPlayer(null, 500, false, 0, false)")
      _ = try runtime.eval("player.play()")
      _ = try await runtime.evalAsync("expo.modules.ExpoAudio.setAudioModeAsync({ shouldPlayInBackground: true })")
    }

    #expect(try #require(session.uses.last).requirements.continuesInBackground)
  }

  @Test
  func `disabling audio ends the uses, releases holds and blocks play`() async throws {
    try await runtime.execute {
      _ = try runtime.eval("globalThis.player = new expo.modules.ExpoAudio.AudioPlayer(null, 500, true, 0, false)")
      _ = try runtime.eval("player.play()")
      _ = try await runtime.evalAsync("expo.modules.ExpoAudio.setIsAudioActiveAsync(false)")
      _ = try runtime.eval("player.play()")
    }

    #expect(session.uses.count == 1)
    #expect(session.uses[0].isEnded)
    #expect(session.holds.first?.isReleased == true)
  }
}
