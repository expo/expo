import ExpoModulesCore
import AVFoundation

class AVAudioEngineBackend: AudioPlayerBackendProtocol {
  let id: String
  let interval: Double

  var supportsPitchCorrectionQuality: Bool { false }
  var isAudioSamplingSupported: Bool { true }
  
  var shouldCorrectPitch = true {
    didSet {
      // In Baseline, shouldCorrectPitch behaves identically to AVPlayer:
      // It enables or disables the pitch shift algorithm.
      // AVAudioUnitTimePitch *always* preserves pitch when changing rate,
      // unless we explicitly adjust the pitch property. 
      updatePitchForVarispeedIfNeeded()
      updateStatus()
    }
  }
  
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .timeDomain
  
  var currentRate: Float = 1.0 {
    didSet {
      currentRate = max(0, currentRate)
      if isPlaying {
        timePitchNode.rate = currentRate
      }
      updatePitchForVarispeedIfNeeded()
    }
  }
  
  private func updatePitchForVarispeedIfNeeded() {
    if !shouldCorrectPitch {
      // If we shouldn't correct pitch, we must simulate varispeed (pitch changes with rate).
      // pitch is in cents. 1 octave = 1200 cents.
      let rateRatio = max(0.01, currentRate) // avoid log2(0)
      let cents = 1200.0 * log2(rateRatio)
      timePitchNode.pitch = min(max(cents, -2400.0), 2400.0)
    } else {
      // Restore to normal pitch if correcting
      timePitchNode.pitch = 0.0
    }
  }
  
  var isPaused: Bool {
    !isPlaying
  }
  
  var samplingEnabled = false {
    didSet {
      guard samplingEnabled != oldValue else { return }
      if samplingEnabled {
        installTap()
      } else {
        uninstallTap()
      }
    }
  }
  
  private var scheduleGeneration = 0
  private var didPlayCurrentGeneration = false
  
  var isLooping = false {
    didSet {
      guard isLooping != oldValue else { return }
      scheduleNextFile()
      updateStatus()
    }
  }
  
  private var _isMuted = false
  var isMuted: Bool {
    get { _isMuted }
    set {
      _isMuted = newValue
      playerNode.volume = _isMuted ? 0.0 : _volume
    }
  }

  private var _volume: Float = 1.0
  var volume: Float {
    get { _volume }
    set {
      _volume = newValue
      if !_isMuted {
        playerNode.volume = _volume
      }
    }
  }

  var pitch: Float {
    get { timePitchNode.pitch / 100.0 }
    set {
      // API uses semitones, AVAudioUnitTimePitch uses cents (100 cents = 1 semitone)
      // Clamp to bounds supported by timePitchNode (-2400 to 2400 cents)
      timePitchNode.pitch = min(max(newValue * 100.0, -2400.0), 2400.0)
      updateStatus()
    }
  }

  var duration: Double {
    guard let file else { return 0.0 }
    let format = file.processingFormat
    return Double(file.length) / format.sampleRate
  }
  
  var currentTime: Double {
    guard isPlaying,
          let nodeTime = playerNode.lastRenderTime,
          let playerTime = playerNode.playerTime(forNodeTime: nodeTime) else {
      return seekOffset
    }
    // Calculate actual time based on sample frame and seek offset
    let frameRate = playerTime.sampleRate
    let currentTime = Double(playerTime.sampleTime) / frameRate
    return min(max(0, seekOffset + currentTime), duration)
  }
  
  var isLive: Bool {
    false
  }
  
  var currentOffsetFromLive: Double? {
    nil
  }
  
  var isLoaded: Bool {
    file != nil
  }
  
  var isPlaying: Bool {
    playerNode.isPlaying
  }
  
  var isBuffering: Bool {
    false // Local files don't buffer
  }

  var onPlaybackComplete: (() -> Void)?
  var onStatusUpdate: (([String: Any]) -> Void)?
  var onAudioSample: (([String: Any]) -> Void)?

  var lockScreenPlayer: AVPlayer? {
    nil
  }

  private var engine = AVAudioEngine()
  private var playerNode = AVAudioPlayerNode()
  private var timePitchNode = AVAudioUnitTimePitch()
  
  private var file: AVAudioFile?
  private var source: AudioSource?
  private var seekOffset: Double = 0.0
  
  private var statusTimer: Timer?
  private var tapInstalled = false

  init(id: String, interval: Double, source: AudioSource?) {
    self.id = id
    self.interval = interval
    self.source = source
    
    setupEngine()
    if let source = source {
      loadSource(source)
    }
  }

  private func setupEngine() {
    engine.attach(playerNode)
    engine.attach(timePitchNode)
    
    let format = engine.outputNode.outputFormat(forBus: 0)
    engine.connect(playerNode, to: timePitchNode, format: format)
    engine.connect(timePitchNode, to: engine.mainMixerNode, format: format)
    
    do {
      try engine.start()
    } catch {
      print("Failed to start AVAudioEngine: \(error)")
    }
  }

  private func loadSource(_ source: AudioSource) {
    guard let url = source.uri else { return }
    do {
      file = try AVAudioFile(forReading: url)
      seekOffset = 0.0
      scheduleNextFile()
      updateStatus()
    } catch {
      print("Failed to load AVAudioFile: \(error)")
    }
  }

  private func scheduleNextFile(at seconds: Double = 0.0) {
    guard let file = file else { return }
    playerNode.stop()
    seekOffset = seconds

    let frameRate = file.processingFormat.sampleRate
    let framePosition = AVAudioFramePosition(seconds * frameRate)
    let frameCount = AVAudioFrameCount(file.length - framePosition)

    guard frameCount > 0 else { return }
    
    scheduleGeneration += 1
    didPlayCurrentGeneration = false
    let currentGeneration = scheduleGeneration

    // Always schedule sequentially unless looping whole file from beginning
    if isLooping && seconds == 0.0 {
      playerNode.scheduleFile(file, at: nil, completionHandler: { [weak self] in
        guard let self = self else { return }
        DispatchQueue.main.async {
          guard self.scheduleGeneration == currentGeneration else { return }
          guard self.didPlayCurrentGeneration else { return }
          if self.isLooping {
            self.scheduleNextFile()
            self.play(at: self.currentRate)
          } else {
            self.handlePlaybackComplete()
          }
        }
      })
    } else {
      playerNode.scheduleSegment(file, startingFrame: framePosition, frameCount: frameCount, at: nil, completionHandler: { [weak self] in
        guard let self = self else { return }
        DispatchQueue.main.async {
          guard self.scheduleGeneration == currentGeneration else { return }
          guard self.didPlayCurrentGeneration else { return }
          if !self.isLooping {
            self.handlePlaybackComplete()
          } else {
            self.scheduleNextFile()
            self.play(at: self.currentRate)
          }
        }
      })
    }
  }

  private func handlePlaybackComplete() {
    playerNode.stop()
    seekOffset = duration
    stopTimer()
    let status = currentStatus()
    var completeStatus = status
    completeStatus["playing"] = false
    completeStatus["didJustFinish"] = true
    onStatusUpdate?(completeStatus)
    onPlaybackComplete?()
  }

  func play(at rate: Float) {
    guard isLoaded else { return }
    if !engine.isRunning {
      do { try engine.start() } catch { print("Failed to start engine: \(error)") }
    }
    timePitchNode.rate = rate
    didPlayCurrentGeneration = true
    playerNode.play()
    startTimer()
    updateStatus()
  }

  func pause() {
    playerNode.pause()
    stopTimer()
    updateStatus()
  }

  func resumePlayback() {
    play(at: currentRate)
  }

  func seekTo(seconds: Double, toleranceMillisBefore: Double?, toleranceMillisAfter: Double?) async {
    let wasPlaying = isPlaying
    scheduleNextFile(at: seconds)
    if wasPlaying {
      playerNode.play()
    }
    updateStatus()
  }

  func replaceCurrentSource(source: AudioSource) {
    self.source = source
    let wasPlaying = isPlaying
    playerNode.stop()
    loadSource(source)
    if wasPlaying {
      play(at: currentRate)
    }
  }

  func teardown() {
    playerNode.stop()
    engine.stop()
    stopTimer()
    uninstallTap()
  }

  func currentStatus() -> [String: Any] {
    let rate = isPlaying ? timePitchNode.rate : currentRate
    return [
      "playbackState": isPlaying ? "playing" : "paused",
      "timeControlStatus": isPlaying ? "playing" : "paused",
      "reasonForWaitingToPlay": "",
      "mute": false, // Engine doesn't have mute property inherently, rely on volume
      "duration": duration,
      "playing": isPlaying,
      "isLoaded": isLoaded,
      "playbackRate": rate,
      "isBuffering": false,
      "isLive": false,
      "currentOffsetFromLive": nil as Any? as Any,
      "error": nil as Any? as Any
    ]
  }

  private func updateStatus() {
    onStatusUpdate?(currentStatus())
  }

  private func startTimer() {
    stopTimer()
    let timeInterval = interval / 1000.0
    statusTimer = Timer.scheduledTimer(withTimeInterval: timeInterval, repeats: true) { [weak self] _ in
      self?.updateStatus()
    }
  }

  private func stopTimer() {
    statusTimer?.invalidate()
    statusTimer = nil
  }

  private func installTap() {
    guard !tapInstalled else { return }
    let format = timePitchNode.outputFormat(forBus: 0)
    timePitchNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, time in
      guard let self = self, self.samplingEnabled else { return }
      
      let channelCount = Int(buffer.format.channelCount)
      let frameLength = Int(buffer.frameLength)
      guard let dataPointer = buffer.floatChannelData else { return }
      
      let channels = (0..<channelCount).map { channelIndex in
        let channelDataPointer = dataPointer[channelIndex]
        let channelData = (0..<frameLength).map { frameIndex in
          channelDataPointer[frameIndex]
        }
        return ["frames": channelData]
      }
      
      let sampleRate = buffer.format.sampleRate
      let seconds = sampleRate > 0 ? Double(time.sampleTime) / sampleRate : 0.0

      self.onAudioSample?([
        "channels": channels,
        "timestamp": seconds
      ])
    }
    tapInstalled = true
  }
  
  private func uninstallTap() {
    guard tapInstalled else { return }
    timePitchNode.removeTap(onBus: 0)
    tapInstalled = false
  }
}
