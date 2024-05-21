import ExpoModulesCore
import Foundation

private let recordingStatus = "onRecordingStatusUpdate"

class AudioRecorder: SharedRef<AVAudioRecorder>, RecordingResultHandler {
  var id = UUID().uuidString
  private lazy var resultHandler = {
    RecordingDelegate(resultHandler: self)
  }()
  var startTimestamp = 0
  var previousRecordingDuration = 0

  override init(_ pointer: AVAudioRecorder) {
    super.init(pointer)
    pointer.delegate = resultHandler

    do {
      try AVAudioSession.sharedInstance().setCategory(.playAndRecord)
    } catch {
      print("Failed to set recording category")
    }
    pointer.prepareToRecord()
  }

  var isRecording: Bool {
    pointer.isRecording
  }

  var currentTime: Double {
    pointer.currentTime * 1000
  }

  var deviceCurrentTime: Int {
    Int(pointer.deviceCurrentTime * 1000)
  }

  var uri: String {
    pointer.url.absoluteString
  }

  func getRecordingStatus() -> [String: Any] {
    let currentDuration = isRecording ? (deviceCurrentTime - startTimestamp) : 0
    let duration = previousRecordingDuration + Int(currentDuration)

    var result: [String: Any] = [
      "canRecord": true,
      "isRecording": isRecording,
      "durationMillis": duration,
      "mediaServicesDidReset": false
    ]

    if pointer.isMeteringEnabled {
      pointer.updateMeters()
      let currentLevel = pointer.averagePower(forChannel: 0)
      result["metering"] = currentLevel
    }

    return result
  }

  func didFinish(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    emit(event: recordingStatus, arguments: [
      "id": id,
      "isFinished": true,
      "hasError": false,
      "url": recorder.url
    ])
  }

  func encodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    emit(event: recordingStatus, arguments: [
      "id": id,
      "isFinished": true,
      "hasError": true,
      "error": error?.localizedDescription,
      "url": nil
    ])
  }
}
