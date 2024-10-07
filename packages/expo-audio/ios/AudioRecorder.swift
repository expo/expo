import ExpoModulesCore

private let recordingStatus = "onRecordingStatusUpdate"

class AudioRecorder: SharedRef<AVAudioRecorder>, RecordingResultHandler {
  let id = UUID().uuidString
  private lazy var recordingDelegate = {
    RecordingDelegate(resultHandler: self)
  }()
  private var startTimestamp = 0
  private var previousRecordingDuration = 0
  private var isPrepared = false
  private lazy var recordingSession = AVAudioSession.sharedInstance()
  
  override init(_ pointer: AVAudioRecorder) {
    super.init(pointer)
    pointer.delegate = recordingDelegate

    do {
      try recordingSession.setCategory(.playAndRecord, mode: .default)
      try recordingSession.setActive(true)
    } catch {
      print("Failed to update the recording session")
    }
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
  
  private var currentDuration: Int {
    deviceCurrentTime - startTimestamp
  }
  
  func prepare(options: RecordingOptions?) {
    ref.prepareToRecord()
    // update the AVAudioRecorder settings
    
    isPrepared = true
  }
  
  func startRecording() -> [String: Any] {
    ref.record()
    startTimestamp = Int(deviceCurrentTime)
    return getRecordingStatus()
  }
  
  func stopRecording() {
    ref.stop()
    startTimestamp = 0
    previousRecordingDuration = 0
    isPrepared = false
  }
  
  func pauseRecording() {
    ref.pause()
    previousRecordingDuration += currentDuration
    startTimestamp = 0
  }

  func getRecordingStatus() -> [String: Any] {
    let currentDuration = isRecording ? currentDuration : 0
    let duration = previousRecordingDuration + Int(currentDuration)

    var result: [String: Any] = [
      "canRecord": isPrepared,
      "isRecording": isRecording,
      "durationMillis": duration,
      "mediaServicesDidReset": false,
      "url": ref.url
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
      "error": nil,
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
