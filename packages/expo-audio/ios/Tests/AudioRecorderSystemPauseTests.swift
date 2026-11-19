#if os(iOS)
import Testing
import AVFoundation

@testable import ExpoAudio

private final class StubRecorder: AVAudioRecorder, @unchecked Sendable {
  var acceptsRecord = true

  override func record() -> Bool {
    acceptsRecord
  }

  override func record(forDuration duration: TimeInterval) -> Bool {
    acceptsRecord
  }
}

@Suite("AudioRecorder system pause")
struct AudioRecorderSystemPauseTests {
  private func makeRecordingRecorder() throws -> AudioRecorder {
    let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).m4a")
    let avRecorder = try StubRecorder(url: url, settings: [
      AVFormatIDKey: kAudioFormatMPEG4AAC,
      AVSampleRateKey: 44_100,
      AVNumberOfChannelsKey: 1
    ])
    let recorder = AudioRecorder(avRecorder, options: RecordingOptions())
    recorder.allowsRecording = true
    recorder.updateStateForDirectRecording()
    return recorder
  }

  private func isRecording(_ recorder: AudioRecorder) -> Bool {
    recorder.getRecordingStatus()["isRecording"] as? Bool ?? false
  }

  @Test
  func `resumes a recorder that the system paused`() throws {
    let recorder = try makeRecordingRecorder()

    recorder.pauseForSystem()
    try recorder.resumeAfterSystemPause()

    #expect(isRecording(recorder))
  }

  @Test
  func `stays paused when iOS rejects the resume`() throws {
    let recorder = try makeRecordingRecorder()
    let avRecorder = try #require(recorder.ref as? StubRecorder)

    recorder.pauseForSystem()
    avRecorder.acceptsRecord = false
    try recorder.resumeAfterSystemPause()
    #expect(!isRecording(recorder))

    avRecorder.acceptsRecord = true
    try recorder.resumeAfterSystemPause()
    #expect(isRecording(recorder))
  }

  @Test
  func `does not resume a recorder that the user paused`() throws {
    let recorder = try makeRecordingRecorder()

    recorder.pauseRecording()
    try recorder.resumeAfterSystemPause()

    #expect(!isRecording(recorder))
  }

  @Test
  func `does not resume a recorder that the user paused during a system pause`() throws {
    let recorder = try makeRecordingRecorder()

    recorder.pauseForSystem()
    recorder.pauseRecording()
    try recorder.resumeAfterSystemPause()

    #expect(!isRecording(recorder))
  }

  @Test
  func `does not resume a recorder that the user stopped during a system pause`() throws {
    let recorder = try makeRecordingRecorder()

    recorder.pauseForSystem()
    recorder.stopRecording()
    try recorder.resumeAfterSystemPause()

    #expect(!isRecording(recorder))
  }
}
#endif
