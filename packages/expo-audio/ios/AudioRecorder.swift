#if os(iOS)
import ExpoMediaSession
import ExpoModulesCore

@Record
struct RecordingStatusEvent {
  var id: String
  var isFinished: Bool
  var hasError: Bool
  var error: String?
  var url: String?
  var mediaServicesDidReset: Bool?
}

enum RecordingState {
  case idle
  case prepared
  case recording
  case paused
  case stopped
  case error
}

@SharedObject
public final class AudioRecorder: SharedRef<AVAudioRecorder>, RecordingResultHandler, SessionCommandTarget {
  @JS
  let id = UUID().uuidString
  private var recordingDelegate: RecordingDelegate?
  private var startTimestamp = 0
  private var totalRecordedDuration = 0
  private var currentState: RecordingState = .idle
  var allowsRecording = false
  private var isPausedBySystem = false
  weak var owningRegistry: AudioComponentRegistry?
  private var mediaServicesDidReset = false
  private var currentOptions: RecordingOptions?
  private var durationLimitSeconds: TimeInterval?
  var continuesInBackground = false
  let sessionUse: SessionUseSlot

  private var isPrepared: Bool {
    currentState == .prepared || currentState == .recording || currentState == .paused
  }

  init(
    _ ref: AVAudioRecorder,
    options: RecordingOptions,
    session: any MediaSessionManaging = MediaSessionManager.shared
  ) {
    currentOptions = options
    sessionUse = SessionUseSlot(session: session, label: "recorder")
    super.init(ref)
    sessionUse.client = "expo-audio:recorder:\(id)"
    sessionUse.target = self
    recordingDelegate = RecordingDelegate(resultHandler: self)
    ref.delegate = recordingDelegate
  }

  @Event("recordingStatusUpdate")
  var onRecordingStatusUpdate: (RecordingStatusEvent) -> Void

  @JS
  nonisolated var isRecording: Bool {
    ref.isRecording
  }

  @JS
  nonisolated var currentTime: Double {
    ref.currentTime
  }

  @JS
  func record(_ options: RecordOptions?) throws -> [String: Any] {
    try AudioRecordingRequester.requirePermission()
    try requireSessionUse()

    switch (options?.atTime, options?.forDuration) {
    case let (atTime?, forDuration?):
      let absoluteTime = ref.deviceCurrentTime + TimeInterval(atTime)
      try recordForDuration(TimeInterval(forDuration), atTime: absoluteTime)
      return getRecordingStatus()
    case let (atTime?, nil):
      let absoluteTime = ref.deviceCurrentTime + TimeInterval(atTime)
      try record(atTime: absoluteTime)
      return getRecordingStatus()
    case let (nil, forDuration?):
      try recordForDuration(TimeInterval(forDuration))
      return getRecordingStatus()
    case (nil, nil):
      return try startRecording()
    }
  }

  @JS
  func pause() throws {
    try AudioRecordingRequester.requirePermission()
    pauseRecording()
  }

  @JS
  func prepareToRecordAsync(_ options: RecordingOptions?) async throws {
    try AudioRecordingRequester.requireUsageDescription()
    let use = sessionUse.sync {
      sessionUse.begin(sessionRequirements)
    }
    do {
      try await use.activated()
    } catch {
      sessionUse.sync {
        sessionUse.end(ifCurrent: use)
      }
      currentState = .error
      throw AudioRecordingException("Failed to configure audio session: \(error.localizedDescription)")
    }
    do {
      try await sessionUse.queue.perform {
        guard self.sessionUse.isCurrent(use) else {
          throw AudioRecordingException(
            "The recorder was stopped while it was preparing. Call prepareToRecordAsync() again to record"
          )
        }
        try self.prepare(options: options)
      }
    } catch {
      sessionUse.sync {
        sessionUse.end(ifCurrent: use)
      }
      throw error
    }
  }

  @JS
  func stop() async throws {
    try AudioRecordingRequester.requirePermission()
    try await sessionUse.queue.perform {
      self.stopRecording()
      self.sessionUse.end()
    }
  }

  func setContinuesInBackground(_ continuesInBackground: Bool) {
    sessionUse.sync {
      self.continuesInBackground = continuesInBackground
      sessionUse.update(sessionRequirements)
    }
  }

  private func requireSessionUse() throws {
    let lostSession = sessionUse.sync {
      isPrepared && !sessionUse.hasUse
    }
    if lostSession {
      throw AudioRecordingException(
        "The recorder lost its audio session, for example after an interruption that did not resume. Call prepareToRecordAsync() again before record()"
      )
    }
  }

  private var sessionRequirements: SessionRequirements {
    SessionRequirements(capabilities: .record, continuesInBackground: continuesInBackground)
  }

  @JS
  func getStatus() -> [String: Any] {
    getRecordingStatus()
  }

  @JS
  func startRecordingAtTime(_ seconds: Double) throws {
    try AudioRecordingRequester.requirePermission()
    try requireSessionUse()
    try record(atTime: TimeInterval(seconds))
  }

  @JS("recordForDuration")
  func recordForDurationFromJS(_ seconds: Double) throws {
    try AudioRecordingRequester.requirePermission()
    try requireSessionUse()
    try recordForDuration(TimeInterval(seconds))
  }

  @JS
  func getAvailableInputs() -> [[String: Any]] {
    RecordingUtils.getAvailableInputs()
  }

  @JS
  func getCurrentInput() throws -> [String: Any] {
    try RecordingUtils.getCurrentInput()
  }

  @JS
  func setInput(_ input: String) throws {
    try RecordingUtils.setInput(input)
  }

  var deviceCurrentTime: Int {
    let time = ref.deviceCurrentTime * 1000
    return time.isNaN ? 0 : Int(time)
  }

  @JS
  var uri: String {
    ref.url.absoluteString
  }

  var fileSize: Int64 {
    let attributes = try? FileManager.default.attributesOfItem(atPath: ref.url.path(percentEncoded: false))
    return (attributes?[.size] as? Int64) ?? 0
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
    durationLimitSeconds = nil
    mediaServicesDidReset = false

    if let options = options ?? currentOptions {
      let newRecorder: AVAudioRecorder
      do {
        newRecorder = try AudioUtils.createRecorder(directory: recordingDirectory(for: options), with: options)
      } catch {
        currentState = .error
        throw error
      }

      currentOptions = options
      ref.delegate = nil
      ref = newRecorder
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
    // `durationLimitSeconds` is deliberately NOT cleared here. This helper runs
    // from `updateStateForDirectRecording()`, which is called *after* a
    // `record(forDuration:)` has already armed the limit, so clearing it here
    // would discard the limit the caller just set. It is cleared at capture
    // boundaries instead.
  }

  func recordForDuration(_ seconds: TimeInterval, atTime absoluteTime: TimeInterval? = nil) throws {
    if currentState == .paused && ref.currentTime >= seconds {
      stopRecording()
      return
    }

    let started = if let absoluteTime {
      ref.record(atTime: absoluteTime, forDuration: seconds)
    } else {
      ref.record(forDuration: seconds)
    }
    guard started else {
      throw RecorderStartRejectedException()
    }
    updateStateForDirectRecording()
    durationLimitSeconds = seconds
  }

  func record(atTime absoluteTime: TimeInterval) throws {
    guard ref.record(atTime: absoluteTime) else {
      throw RecorderStartRejectedException()
    }
    updateStateForDirectRecording()
    durationLimitSeconds = nil
  }

  func startRecording() throws -> [String: Any] {
    guard allowsRecording else {
      throw RecordingDisabledException()
    }

    guard currentState == .prepared || currentState == .paused else {
      return [:]
    }

    // If the recording was armed with a duration, re-apply it.
    let started: Bool
    if let limit = durationLimitSeconds {
      if ref.currentTime >= limit {
        // The allowance is already spent; stop rather than resume.
        stopRecording()
        return getRecordingStatus()
      }
      started = ref.record(forDuration: limit)
    } else {
      started = ref.record()
    }

    guard started else {
      throw RecorderStartRejectedException()
    }

    isPausedBySystem = false
    if currentState != .paused {
      resetDurationTracking()
    }
    startTimestamp = deviceCurrentTime
    currentState = .recording
    return getRecordingStatus()
  }

  // Public method to update state when calling native recording methods directly
  func updateStateForDirectRecording() {
    isPausedBySystem = false
    if currentState != .paused {
      resetDurationTracking()
    }
    startTimestamp = deviceCurrentTime
    currentState = .recording
  }

  func stopRecording() {
    guard currentState == .recording || currentState == .paused else {
      return
    }

    ref.stop()
    currentState = .stopped
    resetDurationTracking()
    durationLimitSeconds = nil
  }

  func pauseRecording() {
    isPausedBySystem = false
    guard currentState == .recording else {
      return
    }

    ref.pause()
    totalRecordedDuration += currentSessionDuration
    startTimestamp = 0
    currentState = .paused
  }

  func pauseForSystem() {
    if currentState == .recording {
      pauseRecording()
      isPausedBySystem = true
    }
  }

  func resumeAfterSystemPause() throws {
    if isPausedBySystem && currentState == .paused {
      _ = try startRecording()
    }
  }

  func getRecordingStatus() -> [String: Any] {
    var result: [String: Any] = [
      "canRecord": isPrepared,
      "isRecording": currentState == .recording,
      "durationMillis": totalDuration,
      "fileSize": Int(fileSize),
      "mediaServicesDidReset": mediaServicesDidReset,
      "url": ref.url.absoluteString
    ]

    if ref.isMeteringEnabled {
      ref.updateMeters()
      result["metering"] = ref.averagePower(forChannel: 0)
    }

    return result
  }

  func handleMediaServicesReset() {
    mediaServicesDidReset = true
    resetDurationTracking()
    durationLimitSeconds = nil

    if let options = currentOptions {
      do {
        try prepare(options: options)
        onRecordingStatusUpdate(RecordingStatusEvent(
          id: id,
          isFinished: true,
          hasError: false,
          error: nil,
          url: nil,
          mediaServicesDidReset: true
        ))
        return
      } catch {}
    }

    currentState = .error
    onRecordingStatusUpdate(RecordingStatusEvent(
      id: id,
      isFinished: true,
      hasError: true,
      error: "Media services were reset by the system",
      url: nil,
      mediaServicesDidReset: true
    ))
  }

  func didFinish(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    // A stop() or a new prepare already reset the state, and a later use may be live.
    if recorder === ref && (currentState == .recording || currentState == .paused) {
      currentState = .stopped
      resetDurationTracking()
      durationLimitSeconds = nil
      endSessionUseLater()
    }

    onRecordingStatusUpdate(RecordingStatusEvent(
      id: id,
      isFinished: true,
      hasError: false,
      error: nil,
      url: recorder.url.absoluteString,
      mediaServicesDidReset: false
    ))
  }

  func encodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    if recorder === ref {
      currentState = .error
      resetDurationTracking()
      durationLimitSeconds = nil
      endSessionUseLater()
    }

    onRecordingStatusUpdate(RecordingStatusEvent(
      id: id,
      isFinished: true,
      hasError: true,
      error: error?.localizedDescription,
      url: nil,
      mediaServicesDidReset: false
    ))
  }

  private func recordingDirectory(for options: RecordingOptions) throws -> URL {
    guard let fileSystem = appContext?.fileSystem else {
      throw Exceptions.AppContextLost()
    }
    let path = (options.directory ?? .cache) == .document ? fileSystem.documentDirectory : fileSystem.cachesDirectory
    return URL(fileURLWithPath: path)
  }

  func endSessionUse() {
    sessionUse.sync {
      sessionUse.end()
    }
  }

  // The recorder can call its delegate from inside stop(), which runs on the session use queue.
  private func endSessionUseLater() {
    sessionUse.queue.async { [sessionUse] in
      sessionUse.end()
    }
  }

  public override func sharedObjectWillRelease() {
    owningRegistry?.remove(self)
    endSessionUseLater()

    if currentState == .recording {
      ref.stop()
    }

    ref.delegate = nil
    recordingDelegate = nil
  }

  func sessionPause(reason: SessionPauseReason) {
    pauseForSystem()
  }

  func sessionResume() {
    try? resumeAfterSystemPause()
  }

  func sessionDuck(_ isDucked: Bool) {}

  func sessionDidFail(_ error: Error) {
    guard currentState == .recording else {
      return
    }
    pauseForSystem()
    appContext?.jsLogger.warn(
      "[expo-audio] Recording was paused because the audio session could not be activated: \(error.localizedDescription). Another app may hold a higher-priority session, for example a phone call. Call `record()` again later."
    )
  }

  func sessionDidEnd() {
    if currentState == .recording || currentState == .paused {
      ref.stop()
    }
  }
}
#endif
