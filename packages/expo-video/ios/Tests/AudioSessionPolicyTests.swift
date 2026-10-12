import AVFoundation
import Testing

@testable import ExpoVideo

@Suite("AudioSessionPolicy")
struct AudioSessionPolicyTests {
  private func player(
    isPlaying: Bool = true,
    isMuted: Bool = false,
    showNowPlayingNotification: Bool = false,
    audioMixingMode: AudioMixingMode = .auto
  ) -> AudioSessionPolicy.PlayerState {
    return AudioSessionPolicy.PlayerState(
      isPlaying: isPlaying,
      isMuted: isMuted,
      showNowPlayingNotification: showNowPlayingNotification,
      audioMixingMode: audioMixingMode
    )
  }

  @Test
  func `muted player switches the default session to mixing playback`() {
    let policy = AudioSessionPolicy.evaluate(
      category: .soloAmbient,
      mode: .default,
      options: [],
      players: [player(isMuted: true)]
    )

    #expect(policy.category == .playback)
    #expect(policy.mode == .moviePlayback)
    #expect(policy.options == [.mixWithOthers])
    #expect(policy.shouldActivate == false)
  }

  @Test
  func `player outputting audio switches the default session to playback and activates it`() {
    let policy = AudioSessionPolicy.evaluate(
      category: .soloAmbient,
      mode: .default,
      options: [],
      players: [player()]
    )

    #expect(policy.category == .playback)
    #expect(policy.mode == .moviePlayback)
    #expect(policy.options.isEmpty)
    #expect(policy.shouldActivate)
  }

  @Test
  func `muted player keeps the play and record session of the app`() {
    let options: AVAudioSession.CategoryOptions = [.defaultToSpeaker, .allowBluetoothA2DP]
    let policy = AudioSessionPolicy.evaluate(
      category: .playAndRecord,
      mode: .default,
      options: options,
      players: [player(isMuted: true)]
    )

    #expect(policy.category == .playAndRecord)
    #expect(policy.mode == .default)
    #expect(policy.options == options)
    #expect(policy.shouldActivate == false)
  }

  @Test
  func `player outputting audio keeps the play and record session of the app and activates it`() {
    let options: AVAudioSession.CategoryOptions = [.defaultToSpeaker, .mixWithOthers]
    let policy = AudioSessionPolicy.evaluate(
      category: .playAndRecord,
      mode: .videoRecording,
      options: options,
      players: [player(audioMixingMode: .doNotMix)]
    )

    #expect(policy.category == .playAndRecord)
    #expect(policy.mode == .videoRecording)
    #expect(policy.options == options)
    #expect(policy.shouldActivate)
  }
}
