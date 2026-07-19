import ExpoModulesCore

protocol RecordingResultHandler {
  func didFinish(_ recorder: AVAudioRecorder, successfully flag: Bool)
  func encodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?)
}

class RecordingDelegate: NSObject, AVAudioRecorderDelegate {
  let resultHandler: RecordingResultHandler

  init(resultHandler: RecordingResultHandler) {
    self.resultHandler = resultHandler
  }

  func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    resultHandler.didFinish(recorder, successfully: flag)
  }

  func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    resultHandler.encodeErrorDidOccur(recorder, error: error)
  }
}
