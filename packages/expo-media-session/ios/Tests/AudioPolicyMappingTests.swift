import AVFoundation
import Testing

@testable import ExpoMediaSession

@Suite("AudioPolicyMapping")
struct AudioPolicyMappingTests {
  private func resolve(_ policy: AudioPolicy, _ requirements: [SessionRequirements] = []) -> ResolvedSession {
    SessionResolver.resolve(policy: policy, requirements: requirements)
  }

  private func configuration(
    silent: Bool = true,
    mode: InterruptionMode = .doNotMix,
    recording: Bool = false,
    earpiece: Bool = false
  ) -> SessionConfiguration {
    resolve(
      AudioPolicy(
        playsInSilentMode: silent,
        interruptionMode: mode,
        allowsRecording: recording,
        shouldRouteThroughEarpiece: earpiece
      )
    ).configuration
  }

  private var bluetooth: AVAudioSession.CategoryOptions {
    #if compiler(>=6.2)
    .allowBluetoothHFP
    #else
    .allowBluetooth
    #endif
  }

  @Test
  func `default policy is mixWithOthers`() {
    #expect(AudioPolicy.default.interruptionMode == .mixWithOthers)
    #expect(AudioPolicy.default.playsInSilentMode == true)
    let config = resolve(.default).configuration
    #expect(config.category == .playback)
    #expect(config.mode == .default)
    #expect(config.options == [.mixWithOthers])
  }

  @Test
  func `category table`() {
    #expect(configuration(silent: false, mode: .doNotMix).category == .soloAmbient)
    #expect(configuration(silent: false, mode: .mixWithOthers).category == .ambient)
    #expect(configuration(silent: false, mode: .mixWithOthers).options == [])
    #expect(configuration(silent: false, mode: .doNotMix).options == [])
    #expect(configuration(silent: true, mode: .doNotMix).category == .playback)

    let recording = configuration(silent: true, mode: .doNotMix, recording: true)
    #expect(recording.category == .playAndRecord)
    #expect(recording.options == [.defaultToSpeaker, bluetooth])

    let earpiece = configuration(silent: true, mode: .doNotMix, recording: true, earpiece: true)
    #expect(!earpiece.options.contains(.defaultToSpeaker))

    #expect(configuration(mode: .duckOthers).options == [.duckOthers])
    #expect(configuration(mode: .mixWithOthers).options == [.mixWithOthers])
  }

  @Test
  func `record capability upgrades category`() {
    let playback = AudioPolicy(playsInSilentMode: true, interruptionMode: .doNotMix)
    let upgraded = resolve(playback, [SessionRequirements(capabilities: .record)]).configuration
    #expect(upgraded.category == .playAndRecord)
    #expect(upgraded.mode == .default)

    let alone = resolve(AudioPolicy(playsInSilentMode: false), [SessionRequirements(capabilities: .measurement)])
      .configuration
    #expect(alone.category == .record)
    #expect(alone.mode == .measurement)

    let during = resolve(playback, [SessionRequirements(capabilities: .measurement)]).configuration
    #expect(during.category == .playAndRecord)
    #expect(during.mode == .measurement)

    let alongsidePlayback = resolve(
      AudioPolicy(playsInSilentMode: false),
      [SessionRequirements(), SessionRequirements(capabilities: .measurement)]
    ).configuration
    #expect(alongsidePlayback.category == .playAndRecord)
    #expect(alongsidePlayback.mode == .measurement)
  }

  @Test
  func `requirement only tightens mixing`() {
    let persistent = AudioPolicy(interruptionMode: .doNotMixPersistent)
    #expect(resolve(persistent, [SessionRequirements(mixing: .doNotMix)]).interruptionMode == .doNotMixPersistent)

    let mixing = resolve(
      .default,
      [SessionRequirements(mixing: .mixWithOthers), SessionRequirements(mixing: .doNotMix)]
    )
    #expect(mixing.interruptionMode == .doNotMix)
    #expect(!mixing.configuration.options.contains(.mixWithOthers))

    let ducking = AudioPolicy(interruptionMode: .duckOthers)
    #expect(resolve(ducking, [SessionRequirements(mixing: .mixWithOthers)]).interruptionMode == .duckOthers)
    #expect(resolve(ducking).interruptionMode == .duckOthers)
  }

  @Test
  func `notify others on deactivation`() {
    #expect(resolve(AudioPolicy(interruptionMode: .doNotMixPersistent)).notifiesOthersOnDeactivation == false)
    #expect(resolve(AudioPolicy(interruptionMode: .doNotMix)).notifiesOthersOnDeactivation == true)
    #expect(resolve(AudioPolicy(interruptionMode: .duckOthers)).notifiesOthersOnDeactivation == true)
    #expect(resolve(AudioPolicy(interruptionMode: .mixWithOthers)).notifiesOthersOnDeactivation == true)
  }

  @Test
  func `most specific mode wins`() {
    let chat = resolve(.default, [SessionRequirements(mode: .moviePlayback), SessionRequirements(mode: .voiceChat)])
    #expect(chat.configuration.mode == .voiceChat)
    #expect(chat.configuration.category == .playAndRecord)
    #expect(chat.configuration.options == [.mixWithOthers, .defaultToSpeaker, bluetooth])

    #expect(resolve(.default, [SessionRequirements(mode: .spokenAudio)]).configuration.mode == .spokenAudio)

    let measured = resolve(
      .default,
      [
        SessionRequirements(mode: .voiceChat),
        SessionRequirements(mode: .measurement),
        SessionRequirements(mode: .videoChat),
      ]
    )
    #expect(measured.configuration.mode == .measurement)
  }

  @Test
  func `smallest IO buffer wins`() {
    let resolved = resolve(
      .default,
      [
        SessionRequirements(preferredIOBufferDuration: 0.02),
        SessionRequirements(),
        SessionRequirements(preferredIOBufferDuration: 0.005),
      ]
    )
    #expect(resolved.preferredIOBufferDuration == 0.005)
    #expect(resolve(.default).preferredIOBufferDuration == nil)
  }

  @Test
  func `extra options are additive`() {
    let resolved = resolve(
      AudioPolicy(allowsRecording: true),
      [
        SessionRequirements(extraOptions: .allowAirPlay),
        SessionRequirements(extraOptions: .allowBluetoothA2DP),
      ]
    )
    #expect(
      resolved.configuration.options
        == [.mixWithOthers, .defaultToSpeaker, bluetooth, .allowAirPlay, .allowBluetoothA2DP]
    )

    let exclusive = resolve(
      AudioPolicy(interruptionMode: .doNotMix, allowsRecording: true),
      [
        SessionRequirements(extraOptions: [
          .mixWithOthers, .duckOthers, .interruptSpokenAudioAndMixWithOthers, .allowAirPlay,
        ])
      ]
    )
    #expect(exclusive.configuration.options == [.defaultToSpeaker, bluetooth, .allowAirPlay])
  }

  @Test
  func `extra options that the category does not support are dropped`() {
    let routing: AVAudioSession.CategoryOptions = [.defaultToSpeaker, .allowAirPlay, .allowBluetoothA2DP, bluetooth]
    let playback = resolve(.default, [SessionRequirements(extraOptions: routing)])
    #expect(playback.configuration.category == .playback)
    #expect(playback.configuration.options == [.mixWithOthers])

    let record = resolve(
      AudioPolicy(playsInSilentMode: false),
      [SessionRequirements(capabilities: .record, extraOptions: routing)]
    )
    #expect(record.configuration.category == .record)
    #expect(record.configuration.options == [bluetooth])
  }

  @Test
  func `movie playback mode needs the playback category`() {
    let movie = [SessionRequirements(mode: .moviePlayback)]
    #expect(resolve(.default, movie).configuration.mode == .moviePlayback)
    #expect(resolve(AudioPolicy(allowsRecording: true), movie).configuration.mode == .default)
    #expect(resolve(AudioPolicy(playsInSilentMode: false), movie).configuration.mode == .default)
  }

  @Test
  func `record category does not mix`() {
    let recorder = [SessionRequirements(capabilities: .record)]
    let alone = resolve(AudioPolicy(playsInSilentMode: false), recorder)
    #expect(alone.configuration.category == .record)
    #expect(alone.interruptionMode == .doNotMix)

    let persistent = AudioPolicy(playsInSilentMode: false, interruptionMode: .doNotMixPersistent)
    #expect(resolve(persistent, recorder).interruptionMode == .doNotMixPersistent)
    #expect(resolve(.default, recorder).interruptionMode == .mixWithOthers)
  }

  @Test
  func `validation rejects duck without silent mode`() {
    let policy = AudioPolicy(playsInSilentMode: false, interruptionMode: .duckOthers)
    #expect(throws: InvalidAudioPolicyException.self) {
      try policy.validate()
    }
    #expect(throws: Never.self) {
      try AudioPolicy.default.validate()
    }
  }
}
