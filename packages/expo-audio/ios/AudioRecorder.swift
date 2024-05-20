import ExpoModulesCore
import Foundation

private let recordingStatus = "onRecordingStatusUpdate"

class AudioRecorder: SharedRef<AVAudioRecorder>, Identifiable, RecordingResultHandler {
  var id = UUID().uuidString
  private lazy var resultHandler = {
    RecordingDelegate(resultHandler: self)
  }()

  override init(_ pointer: AVAudioRecorder) {
    super.init(pointer)
    pointer.delegate = resultHandler
  }

  func didFinish(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    emit(event: recordingStatus, arguments: [
      "isFinished": true,
      "hasError": false,
      "url": recorder.url
    ])
  }

  func encodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    emit(event: recordingStatus, arguments: [
      "isFinished": true,
      "hasError": true,
      "error": error?.localizedDescription,
      "url": nil
    ])
  }
}
