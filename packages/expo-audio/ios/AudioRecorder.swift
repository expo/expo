import ExpoModulesCore

private let recordingStatus = "recordingStatusUpdate"

enum RecordingState {
  case idle
  case prepared
  case recording
  case paused
  case stopped
  case error
}

class AudioRecorder: SharedRef<AVAudioRecorder>, RecordingResultHandler {
  let id = UUID().uuidString
  private var recordingDelegate: RecordingDelegate?
  private var startTimestamp = 0
  private var totalRecordedDuration = 0
  private var currentState: RecordingState = .idle
  private var recordingSession = AVAudioSession.sharedInstance()
  var allowsRecording = true
  weak var owningRegistry: AudioComponentRegistry?

  private var isPrepared: Bool {
    currentState == .prepared || currentState == .recording || currentState == .paused
  }

  override init(_ ref: AVAudioRecorder) {
    super.init(ref)
    recordingDelegate = RecordingDelegate(resultHandler: self)
    ref.delegate = recordingDelegate
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

  private var currentSessionDuration: Int {
    guard startTimestamp > 0, currentState == .recording else {
      return 0
    }
    return deviceCurrentTime - startTimestamp
  }

  private var totalDuration: Int {
    switch currentState {
    case .recording:
      return totalRecordedDuration + currentSessionDuration
    case .paused:
      return totalRecordedDuration
    case .stopped, .idle, .prepared, .error:
      return 0
    }
  }

  func prepare(options: RecordingOptions?) throws {
    if currentState == .recording {
      ref.stop()
    }
    resetDurationTracking()

    do {
      try recordingSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
      try recordingSession.setActive(true)
    } catch {
      currentState = .error
      throw AudioRecordingException("Failed to configure audio session: \(error.localizedDescription)")
    }

    if let options {
      ref.delegate = nil
      ref = AudioUtils.createRecorder(directory: recordingDirectory, with: options)
      ref.delegate = recordingDelegate
    }

    let prepared = ref.prepareToRecord()
    if prepared {
      currentState = .prepared
    } else {
      currentState = .error
      throw AudioRecordingException("Failed to prepare recorder")
    }
  }

  private func resetDurationTracking() {
    startTimestamp = 0
    totalRecordedDuration = 0
  }

  func startRecording() -> [String: Any] {
    guard allowsRecording else {
      log.info("Recording is currently disabled")
      return [:]
    }

    guard currentState == .prepared || currentState == .paused else {
      return [:]
    }

    if currentState != .paused {
      resetDurationTracking()
    }

    ref.record()
    startTimestamp = deviceCurrentTime
    currentState = .recording
    return getRecordingStatus()
  }

  func stopRecording() {
    guard currentState == .recording || currentState == .paused else {
      return
    }

    ref.stop()
    currentState = .stopped
    resetDurationTracking()
  }

  func pauseRecording() {
    guard currentState == .recording else {
      return
    }

    ref.pause()
    totalRecordedDuration += currentSessionDuration
    startTimestamp = 0
    currentState = .paused
  }

  func getRecordingStatus() -> [String: Any] {
    var result: [String: Any] = [
      "canRecord": isPrepared,
      "isRecording": currentState == .recording,
      "durationMillis": totalDuration,
      "mediaServicesDidReset": false,
      "url": ref.url
    ]

    if ref.isMeteringEnabled {
      ref.updateMeters()
      result["metering"] = ref.averagePower(forChannel: 0)
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

  private var recordingDirectory: URL? {
    guard let cachesDir = appContext?.fileSystem?.cachesDirectory, let directory = URL(string: cachesDir) else {
      return nil
    }
    return directory
  }

  override func sharedObjectWillRelease() {
    owningRegistry?.remove(self)

    if currentState == .recording {
      ref.stop()
    }

    ref.delegate = nil
    recordingDelegate = nil

    do {
      try recordingSession.setActive(false, options: [.notifyOthersOnDeactivation])
    } catch {
    }
  }
}
