import ExpoModulesCore

private let recordingStatus = "onRecordingStatusUpdate"

class AudioRecorder: SharedRef<AVAudioRecorder>, RecordingResultHandler {
  let id = UUID().uuidString
  private lazy var recordingDelegate = {
    RecordingDelegate(resultHandler: self)
  }()
  var startTimestamp = 0
  var previousRecordingDuration = 0

  override init(_ pointer: AVAudioRecorder) {
    super.init(pointer)
    pointer.delegate = recordingDelegate

    do {
      try AVAudioSession.sharedInstance().setCategory(.playAndRecord)
    } catch {
      print("Failed to set recording category")
    }
    ref.prepareToRecord()
  }

  var isRecording: Bool {
    ref.isRecording
  }

  var currentTime: Double {
    ref.currentTime * 1000
  }

  var deviceCurrentTime: Int {
    Int(ref.deviceCurrentTime * 1000)
  }

  var uri: String {
    ref.url.absoluteString
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

    if ref.isMeteringEnabled {
      ref.updateMeters()
      let currentLevel = ref.averagePower(forChannel: 0)
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

  override func sharedObjectWillRelease() {
    AudioComponentRegistry.shared.remove(self)
    ref.stop()
  }
}
