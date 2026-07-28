import Testing
import AVFoundation
import AudioToolbox

@testable import ExpoAudio

@Suite("AudioUtils.createRecordingOptions")
struct CreateRecordingOptionsTests {
  private func makeOptions() -> RecordingOptions {
    let options = RecordingOptions()
    options.sampleRate = 44100
    options.numberOfChannels = 2
    options.bitRate = 128000
    options.audioQuality = 96
    return options
  }

  @Test
  func `carries sample rate, channel count and bit rate into the settings`() {
    let settings = AudioUtils.createRecordingOptions(makeOptions())

    #expect(settings[AVSampleRateKey] as? Double == 44100)
    #expect(settings[AVNumberOfChannelsKey] as? Double == 2)
    #expect(settings[AVEncoderBitRateKey] as? Double == 128000)
  }

  @Test(arguments: [BitRateStrategy.constant, .longTermAverage])
  func `uses the constant quality key for non-variable strategies`(strategy: BitRateStrategy) {
    let options = makeOptions()
    options.bitRateStrategy = strategy

    let settings = AudioUtils.createRecordingOptions(options)

    #expect(settings[AVEncoderAudioQualityKey] as? Int == 96)
    #expect(settings[AVEncoderAudioQualityForVBRKey] == nil)
    #expect(settings[AVEncoderBitRateStrategyKey] as? String == strategy.toAVBitRateStrategy())
  }

  @Test(arguments: [BitRateStrategy.variable, .variableConstrained])
  func `uses the VBR quality key for variable strategies`(strategy: BitRateStrategy) {
    let options = makeOptions()
    options.bitRateStrategy = strategy

    let settings = AudioUtils.createRecordingOptions(options)

    #expect(settings[AVEncoderAudioQualityForVBRKey] as? Int == 96)
    #expect(settings[AVEncoderAudioQualityKey] == nil)
  }

  @Test
  func `omits optional PCM keys when the options leave them unset`() {
    let settings = AudioUtils.createRecordingOptions(makeOptions())

    #expect(settings[AVEncoderBitDepthHintKey] == nil)
    #expect(settings[AVLinearPCMBitDepthKey] == nil)
    #expect(settings[AVLinearPCMIsBigEndianKey] == nil)
    #expect(settings[AVLinearPCMIsFloatKey] == nil)
  }

  @Test
  func `includes optional PCM keys when the options provide them`() {
    let options = makeOptions()
    options.bitDepthHint = 24
    options.linearPCMBitDepth = 16
    options.linearPCMIsBigEndian = false
    options.linearPCMIsFloat = true

    let settings = AudioUtils.createRecordingOptions(options)

    #expect(settings[AVEncoderBitDepthHintKey] as? Double == 24)
    #expect(settings[AVLinearPCMBitDepthKey] as? Double == 16)
    #expect(settings[AVLinearPCMIsBigEndianKey] as? Bool == false)
    #expect(settings[AVLinearPCMIsFloatKey] as? Bool == true)
  }

  @Test(arguments: [
    ("lpcm", kAudioFormatLinearPCM),
    ("aac ", kAudioFormatMPEG4AAC),
  ] as [(String, AudioFormatID)])
  func `packs the output format string into a CoreAudio format id`(format: String, expected: AudioFormatID) {
    let options = makeOptions()
    options.outputFormat = format

    let settings = AudioUtils.createRecordingOptions(options)

    #expect(settings[AVFormatIDKey] as? AudioFormatID == expected)
  }
}

@Suite("AudioUtils.validateAudioMode")
struct ValidateAudioModeTests {
  @Test
  func `accepts a mode that plays in silent mode`() throws {
    let mode = AudioMode()
    mode.playsInSilentMode = true
    mode.interruptionMode = .duckOthers
    mode.allowsRecording = true
    mode.shouldPlayInBackground = true

    #expect(throws: Never.self) {
      try AudioUtils.validateAudioMode(mode: mode)
    }
  }

  @Test
  func `rejects ducking others while not playing in silent mode`() {
    let mode = AudioMode()
    mode.playsInSilentMode = false
    mode.interruptionMode = .duckOthers

    #expect(throws: InvalidAudioModeException.self) {
      try AudioUtils.validateAudioMode(mode: mode)
    }
  }

  @Test
  func `rejects recording while not playing in silent mode`() {
    let mode = AudioMode()
    mode.playsInSilentMode = false
    mode.allowsRecording = true

    #expect(throws: InvalidAudioModeException.self) {
      try AudioUtils.validateAudioMode(mode: mode)
    }
  }

  @Test
  func `rejects background playback while not playing in silent mode`() {
    let mode = AudioMode()
    mode.playsInSilentMode = false
    mode.shouldPlayInBackground = true

    #expect(throws: InvalidAudioModeException.self) {
      try AudioUtils.validateAudioMode(mode: mode)
    }
  }
}

@Suite("AudioUtils.getFileExtension")
struct GetFileExtensionTests {
  @Test
  func `resolves a known audio mime type to its extension`() {
    #expect(AudioUtils.getFileExtension(for: "audio/mpeg") == "mp3")
  }

  @Test
  func `falls back to dat for an unrecognized mime type`() {
    #expect(AudioUtils.getFileExtension(for: "not-a-real/mime-type") == "dat")
  }
}
