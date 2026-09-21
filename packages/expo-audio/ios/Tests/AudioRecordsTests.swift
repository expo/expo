import Testing
import AVFoundation

@testable import ExpoAudio

@Suite("AudioRecords")
struct AudioRecordsTests {
  @Test(arguments: [
    (BitRateStrategy.constant, AVAudioBitRateStrategy_Constant),
    (.longTermAverage, AVAudioBitRateStrategy_LongTermAverage),
    (.variableConstrained, AVAudioBitRateStrategy_VariableConstrained),
    (.variable, AVAudioBitRateStrategy_Variable),
  ] as [(BitRateStrategy, String)])
  func `maps bit rate strategy to the AVFoundation constant`(strategy: BitRateStrategy, expected: String) {
    #expect(strategy.toAVBitRateStrategy() == expected)
  }

  @Test(arguments: [
    (IOSAudioMode.default, AVAudioSession.Mode.default),
    (.spokenAudio, .spokenAudio),
    (.measurement, .measurement),
    (.voiceChat, .voiceChat),
    (.videoChat, .videoChat),
    (.videoRecording, .videoRecording),
    (.gameChat, .gameChat),
    (.moviePlayback, .moviePlayback),
    (.voicePrompt, .voicePrompt),
  ] as [(IOSAudioMode, AVAudioSession.Mode)])
  func `maps the iOS audio mode to the AVAudioSession mode`(
    mode: IOSAudioMode,
    expected: AVAudioSession.Mode
  ) {
    #expect(mode.toAVMode() == expected)
  }

  @Test(arguments: [
    (PitchCorrectionQuality.low, AVAudioTimePitchAlgorithm.varispeed),
    (.medium, .timeDomain),
    (.high, .spectral),
  ] as [(PitchCorrectionQuality, AVAudioTimePitchAlgorithm)])
  func `maps pitch correction quality to the pitch algorithm`(
    quality: PitchCorrectionQuality,
    expected: AVAudioTimePitchAlgorithm
  ) {
    #expect(quality.toPitchAlgorithm() == expected)
  }

  @Test(arguments: [
    (AudioStreamFileFormat.wav, "wav"),
    (.pcm, "pcm"),
  ] as [(AudioStreamFileFormat, String)])
  func `exposes the file extension matching the format`(format: AudioStreamFileFormat, expected: String) {
    #expect(format.fileExtension == expected)
  }
}
