import ExpoModulesCore
import AVFoundation

private enum AudioConstants {
  static let playbackStatus = "playbackStatusUpdate"
  static let audioSample = "audioSampleUpdate"
}

public class AudioPlayer: SharedObject, Playable, LockScreenPlayable {
  let id = UUID().uuidString
  var isActiveForLockScreen = false
  var metadata: Metadata?
  var lockScreenOptions: LockScreenOptions?
  var keepAudioSessionActive = false
  weak var owningRegistry: AudioComponentRegistry?
  var onPlaybackComplete: (() -> Void)?

  var lockScreenPlayer: AVPlayer? {
    backend?.lockScreenPlayer
  }

  func seek(to time: Double, toleranceBefore: Double?, toleranceAfter: Double?) async {
    let toleranceMillisBefore = toleranceBefore.map { $0 * 1000.0 }
    let toleranceMillisAfter = toleranceAfter.map { $0 * 1000.0 }
    await seekTo(seconds: time, toleranceMillisBefore: toleranceMillisBefore, toleranceMillisAfter: toleranceMillisAfter)
  }

  private var backend: AudioPlayerBackendProtocol!
  private let interval: Double
  private var source: AudioSource?
  private var preloadedPlayer: AVPlayer?

  var wasPlaying: Bool = false

  init(interval: Double, source: AudioSource?, preloadedPlayer: AVPlayer? = nil) {
    self.interval = interval
    self.source = source
    self.preloadedPlayer = preloadedPlayer
    super.init()

    setupBackend(with: source)
  }

  private func setupBackend(with source: AudioSource?) {
    // Teardown old backend if exists
    backend?.teardown()

    let isLocalFile = source?.uri?.isFileURL ?? false
    if isLocalFile && preloadedPlayer == nil {
      backend = AVAudioEngineBackend(id: id, interval: interval, source: source)
    } else {
      backend = AVPlayerBackend(id: id, interval: interval, source: source, preloadedPlayer: preloadedPlayer)
      // Consume the preloaded player so it's not reused if we replace source later
      preloadedPlayer = nil
    }

    backend.onStatusUpdate = { [weak self] status in
      guard let self else { return }
      self.emit(event: AudioConstants.playbackStatus, payload: status)
      if self.isActiveForLockScreen {
        MediaController.shared.updateNowPlayingInfo(for: self)
      }
    }

    backend.onAudioSample = { [weak self] sample in
      guard let self else { return }
      self.emit(event: AudioConstants.audioSample, payload: sample)
    }

    backend.onPlaybackComplete = { [weak self] in
      self?.onPlaybackComplete?()
    }

    // Apply any pending states if we are swapping backend dynamically
    // (though in init it's fine, replaceCurrentSource will use this)
    backend.shouldCorrectPitch = shouldCorrectPitch
    backend.pitchCorrectionQuality = pitchCorrectionQuality
    backend.currentRate = currentRate
    backend.isLooping = isLooping
    backend.samplingEnabled = samplingEnabled
    // volume is maintained by the new backend initialization default usually, but we could sync it
  }

  // MARK: - Proxied Properties

  var shouldCorrectPitch: Bool = true {
    didSet { backend.shouldCorrectPitch = shouldCorrectPitch }
  }

  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .timeDomain {
    didSet { backend.pitchCorrectionQuality = pitchCorrectionQuality }
  }

  var currentRate: Float = 1.0 {
    didSet { backend.currentRate = currentRate }
  }

  var isPaused: Bool { backend.isPaused }
  
  var samplingEnabled: Bool = false {
    didSet { backend.samplingEnabled = samplingEnabled }
  }

  var isLooping: Bool = false {
    didSet { backend.isLooping = isLooping }
  }

  var volume: Float {
    get { backend.volume }
    set { backend.volume = newValue }
  }

  var isMuted: Bool {
    get { backend.isMuted }
    set { backend.isMuted = newValue }
  }

  var duration: Double { backend.duration }
  var currentTime: Double { backend.currentTime }
  var isLive: Bool { backend.isLive }
  var currentOffsetFromLive: Double? { backend.currentOffsetFromLive }
  var isLoaded: Bool { backend.isLoaded }
  var isPlaying: Bool { backend.isPlaying }
  var isBuffering: Bool { backend.isBuffering }

  // MARK: - Proxied Methods

  func play(at rate: Float) {
    backend.play(at: rate)
    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func pause() {
    backend.pause()
  }

  func resumePlayback() {
    backend.resumePlayback()
  }



  func seekTo(seconds: Double, toleranceMillisBefore: Double?, toleranceMillisAfter: Double?) async {
    await backend.seekTo(seconds: seconds, toleranceMillisBefore: toleranceMillisBefore, toleranceMillisAfter: toleranceMillisAfter)
  }

  func replaceCurrentSource(source: AudioSource, preloadedPlayer: AVPlayer? = nil) {
    self.source = source
    self.preloadedPlayer = preloadedPlayer
    
    let isLocalFile = source.uri?.isFileURL ?? false
    let currentIsEngine = backend is AVAudioEngineBackend
    
    if (isLocalFile && !currentIsEngine) || (!isLocalFile && currentIsEngine) || (preloadedPlayer != nil) {
      // Need to swap backends because source type changed or we have a new preloaded AVPlayer
      let wasPlaying = backend.isPlaying
      let wasSampling = samplingEnabled
      
      setupBackend(with: source)
      
      if wasPlaying {
        backend.play(at: currentRate)
      }
    } else {
      // Just swap the source in the existing backend
      backend.replaceCurrentSource(source: source)
    }
  }

  func setSamplingEnabled(enabled: Bool) {
    self.samplingEnabled = enabled
  }

  func handleMediaServicesReset() {
    // When media services reset, we must tear down and recreate
    let wasPlaying = backend.isPlaying
    setupBackend(with: source)
    if wasPlaying {
      backend.play(at: currentRate)
    }
  }

  func currentStatus() -> [String: Any] {
    var status = backend.currentStatus()
    status["id"] = id
    status["shouldCorrectPitch"] = shouldCorrectPitch
    status["loop"] = isLooping
    status["mute"] = isMuted
    status["currentTime"] = currentTime
    status["didJustFinish"] = false
    return status
  }

  func setActiveForLockScreen(_ active: Bool = true, metadata: Metadata? = nil, options: LockScreenOptions?) {
    self.metadata = metadata
    self.isActiveForLockScreen = active
    self.lockScreenOptions = active ? options : nil
    if active {
      MediaController.shared.setActivePlayable(self, options: options)
    } else {
      MediaController.shared.setActivePlayable(nil)
    }
  }

  func updateStatus(with dict: [String: Any]) {
    // If the JS layer or someone forces an update, we just proxy it to backend's state update handler
    // But since backend doesn't have an updateStatus with dict injected easily from outside,
    // we can just emit. Wait, we usually don't call this from outside anymore except perhaps internally.
    var arguments = currentStatus()
    arguments.merge(dict) { _, new in new }
    self.emit(event: AudioConstants.playbackStatus, payload: arguments)

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  public override func sharedObjectWillRelease() {
    backend.teardown()
    owningRegistry?.remove(self)

    if isActiveForLockScreen {
      MediaController.shared.setActivePlayable(nil)
    }
  }
}
