import ExpoModulesCore
import Combine

private enum AudioConstants {
  static let playbackStatus = "playbackStatusUpdate"
  static let audioSample = "audioSampleUpdate"
}

public class AudioPlayer: SharedRef<AVPlayer>, Playable {
  let id = UUID().uuidString
  var shouldCorrectPitch = true
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .timeDomain
  var isActiveForLockScreen = false
  var metadata: Metadata?
  var currentRate: Float = 1.0 {
    didSet {
      currentRate = max(0, currentRate)
    }
  }
  let interval: Double
  var wasPlaying = false
  var isPaused: Bool {
    ref.rate == 0.0
  }
  var samplingEnabled = false
  var keepAudioSessionActive = false

  var isLooping = false {
    didSet {
      guard isLooping != oldValue else {
        return
      }
      if isLooping {
        ref.actionAtItemEnd = .advance
        enqueueNextLoopItem()
      } else {
        removeQueuedLoopItems()
        ref.actionAtItemEnd = .pause
      }
      updateStatus(with: [:])
    }
  }

  private var source: AudioSource?

  // MARK: Observers
  private var timeToken: Any?
  private var cancellables = Set<AnyCancellable>()
  private var endObserver: NSObjectProtocol?

  private var audioProcessor: AudioTapProcessor?
  private var tapInstalled = false
  private var shouldInstallAudioTap = false
  weak var owningRegistry: AudioComponentRegistry?
  var onPlaybackComplete: (() -> Void)?

  var duration: Double {
    let seconds = ref.currentItem?.duration.seconds ?? 0.0
    return seconds.isNaN ? 0.0 : seconds
  }

  var currentTime: Double {
    let seconds = ref.currentItem?.currentTime().seconds ?? 0.0
    return seconds.isNaN ? 0.0 : seconds
  }

  init(_ ref: AVPlayer, interval: Double, source: AudioSource? = nil) {
    self.interval = interval
    self.source = source
    super.init(ref)

    setupPublisher()
  }

  var isLoaded: Bool {
    ref.currentItem?.status == .readyToPlay
  }

  var isPlaying: Bool {
    ref.timeControlStatus == .playing
  }

  var isBuffering: Bool {
    ref.isBuffering(isPlaying: isPlaying)
  }

  private var effectiveRate: Float {
    currentRate > 0 ? currentRate : 1.0
  }

  func play(at rate: Float) {
    ref.actionAtItemEnd = isLooping ? .advance : .pause
    if isLooping {
      enqueueNextLoopItem()
    }
    addPlaybackEndNotification()
    registerTimeObserver()
    ref.playImmediately(atRate: rate)

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func setSamplingEnabled(enabled: Bool) {
    if samplingEnabled == enabled {
      return
    }
    samplingEnabled = enabled
    if enabled {
      if isLoaded {
        installTap()
      } else {
        shouldInstallAudioTap = true
      }
    } else {
      uninstallTap()
      shouldInstallAudioTap = false
    }
  }

  func currentStatus() -> [String: Any] {
    let currentDuration = ref.status == .readyToPlay ? duration : 0.0
    let rate = isPlaying ? ref.rate : currentRate
    return [
      "id": id,
      "currentTime": currentTime,
      "playbackState": statusToString(status: ref.status),
      "timeControlStatus": timeControlStatusString(status: ref.timeControlStatus),
      "reasonForWaitingToPlay": reasonForWaitingToPlayString(status: ref.reasonForWaitingToPlay),
      "mute": ref.isMuted,
      "duration": currentDuration,
      "playing": isPlaying,
      "loop": isLooping,
      "didJustFinish": false,
      "isLoaded": isLoaded,
      "playbackRate": rate,
      "shouldCorrectPitch": shouldCorrectPitch,
      "isBuffering": isBuffering
    ]
  }

  func setActiveForLockScreen(_ active: Bool = true, metadata: Metadata? = nil, options: LockScreenOptions?) {
    self.metadata = metadata
    if active {
      MediaController.shared.setActivePlayer(self, options: options)
    } else {
      MediaController.shared.setActivePlayer(nil)
    }
  }

  func updateStatus(with dict: [String: Any]) {
    var arguments = currentStatus()
    arguments.merge(dict) { _, new in
      new
    }
    self.emit(event: AudioConstants.playbackStatus, arguments: arguments)

    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }
  }

  func seekTo(seconds: Double, toleranceMillisBefore: Double? = nil, toleranceMillisAfter: Double? = nil) async {
    let time = CMTime(seconds: seconds, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    let toleranceBefore = toleranceMillisBefore.map {
      CMTime(seconds: $0 / 1000.0, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    } ?? CMTime.positiveInfinity
    let toleranceAfter = toleranceMillisAfter.map {
      CMTime(seconds: $0 / 1000.0, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    } ?? CMTime.positiveInfinity

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      ref.seek(to: time, toleranceBefore: toleranceBefore, toleranceAfter: toleranceAfter) { [weak self] _ in
        if let self {
          self.updateStatus(with: [
            "currentTime": self.currentTime
          ])
        }
        continuation.resume()
      }
    }
  }

  private func setupPublisher() {
    ref.publisher(for: \.currentItem?.status)
      .sink { [weak self] status in
        guard let self, let status else {
          return
        }
        if status == .readyToPlay {
          self.updateStatus(with: [
            "isLoaded": true
          ])
          if self.isLooping {
            self.enqueueNextLoopItem()
          }
          if shouldInstallAudioTap || samplingEnabled {
            installTap()
            shouldInstallAudioTap = false
          }
        }
      }
      .store(in: &cancellables)

    ref.publisher(for: \.currentItem)
      .sink { [weak self] _ in
        guard let self else {
          return
        }
        if self.isLooping {
          self.enqueueNextLoopItem()
          self.addPlaybackEndNotification()
        }
        if self.samplingEnabled && self.isLoaded {
          self.uninstallTap()
          self.installTap()
        }
      }
      .store(in: &cancellables)
  }

  func replaceWithPreloadedItem(_ item: AVPlayerItem?) {
    let wasPlaying = ref.timeControlStatus == .playing
    let wasSamplingEnabled = samplingEnabled
    removeQueuedLoopItems()
    ref.pause()

    if samplingEnabled {
      uninstallTap()
    }
    replacePlayerItem(with: item)

    if wasSamplingEnabled {
      shouldInstallAudioTap = true
    }

    if wasPlaying {
      play(at: effectiveRate)
    }
  }

  func replaceCurrentSource(source: AudioSource) {
    self.source = source
    let wasPlaying = ref.timeControlStatus == .playing
    let wasSamplingEnabled = samplingEnabled
    removeQueuedLoopItems()
    ref.pause()

    if samplingEnabled {
      uninstallTap()
    }
    let item = AudioUtils.createAVPlayerItem(from: source)
    replacePlayerItem(with: item)

    if wasSamplingEnabled {
      shouldInstallAudioTap = true
    }

    if wasPlaying {
      onReady { [weak self] in
        guard let self else { return }
        self.play(at: self.effectiveRate)
      }
    }
  }

  func handleMediaServicesReset() {
    guard let source else {
      updateStatus(with: ["mediaServicesDidReset": true])
      return
    }

    // Store these before we reset
    let shouldResume = wasPlaying
    let savedTime = currentTime
    let savedRate = currentRate > 0 ? currentRate : 1.0
    let wasSamplingEnabled = samplingEnabled

    replacePlayer(with: source, restoreSampling: wasSamplingEnabled)

    onReady { [weak self] in
      guard let self else { return }
      self.restorePlaybackState(time: savedTime, shouldResume: shouldResume, rate: savedRate)
      self.wasPlaying = false
      self.updateStatus(with: ["mediaServicesDidReset": true])
    }
  }

  private func replacePlayer(with source: AudioSource, restoreSampling: Bool) {
    teardownPlayer()

    ref = AudioUtils.createAVPlayer(from: source)
    setupPublisher()

    if restoreSampling {
      shouldInstallAudioTap = true
    }
  }

  private func teardownPlayer() {
    removeQueuedLoopItems()
    if samplingEnabled {
      uninstallTap()
    }
    if let timeToken {
      ref.removeTimeObserver(timeToken)
      self.timeToken = nil
    }
    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
      self.endObserver = nil
    }
    cancellables.removeAll()
    ref.pause()
  }

  private func onReady(_ completion: @escaping () -> Void) {
    ref.publisher(for: \.currentItem?.status)
      .compactMap { $0 }
      .filter { $0 == .readyToPlay }
      .first()
      .sink { _ in completion() }
      .store(in: &cancellables)
  }

  private func restorePlaybackState(time: Double, shouldResume: Bool, rate: Float) {
    let cmTime = CMTime(seconds: time, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    ref.seek(to: cmTime) { [weak self] _ in
      guard let self, shouldResume else { return }
      self.play(at: rate)
    }
  }

  private func installTap() {
    guard isLoaded else {
      shouldInstallAudioTap = true
      return
    }

    guard audioProcessor?.isTapInstalled != true else {
      tapInstalled = true
      return
    }

    if let audioProcessor {
      audioProcessor.invalidate()
    }

    audioProcessor = AudioTapProcessor(player: ref)
    let success = audioProcessor?.installTap() ?? false
    tapInstalled = success

    if success {
      audioProcessor?.sampleBufferCallback = { [weak self] buffer, frameCount, timestamp in
        guard let self = self,
          let audioBuffer = buffer?.pointee,
          let data = audioBuffer.mData,
          self.samplingEnabled else {
          return
        }

        let channelCount = Int(audioBuffer.mNumberChannels)
        let dataPointer = data.assumingMemoryBound(to: Float.self)

        let channels = (0..<channelCount).map { channelIndex in
          let channelData = stride(from: channelIndex, to: Int(frameCount), by: channelCount).map { frameIndex in
            dataPointer[frameIndex]
          }
          return ["frames": channelData]
        }

        self.emit(event: AudioConstants.audioSample, arguments: [
          "channels": channels,
          "timestamp": timestamp
        ])
      }
    }
  }

  private func uninstallTap() {
    tapInstalled = false
    audioProcessor?.uninstallTap()
    audioProcessor?.sampleBufferCallback = nil
  }

  private func replacePlayerItem(with item: AVPlayerItem?) {
    if let queuePlayer = ref as? AVQueuePlayer {
      queuePlayer.removeAllItems()
      if let item {
        queuePlayer.insert(item, after: nil)
      }
    } else {
      ref.replaceCurrentItem(with: item)
    }
  }

  private func enqueueNextLoopItem() {
    guard let queuePlayer = ref as? AVQueuePlayer,
      let currentItem = queuePlayer.currentItem else {
      return
    }

    guard queuePlayer.items().count <= 1 else {
      return
    }
    let nextItem = AVPlayerItem(asset: currentItem.asset)
    nextItem.audioTimePitchAlgorithm = currentItem.audioTimePitchAlgorithm
    queuePlayer.insert(nextItem, after: currentItem)
  }

  private func removeQueuedLoopItems() {
    guard let queuePlayer = ref as? AVQueuePlayer else {
      return
    }

    for item in queuePlayer.items() where item != queuePlayer.currentItem {
      queuePlayer.remove(item)
    }
  }

  private func addPlaybackEndNotification() {
    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
    }

    endObserver = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: nil,
      queue: nil
    ) { [weak self] notification in
      guard let self,
        let finishedItem = notification.object as? AVPlayerItem else {
        return
      }

      guard let queuePlayer = self.ref as? AVQueuePlayer,
        finishedItem == queuePlayer.currentItem || queuePlayer.items().contains(finishedItem) else {
        return
      }

      if !self.isLooping {
        let currentTime = finishedItem.duration.seconds
        self.updateStatus(with: [
          "playing": false,
          "currentTime": currentTime.isNaN ? 0.0 : currentTime,
          "didJustFinish": true
        ])
        self.onPlaybackComplete?()
      }
    }
  }

  private func registerTimeObserver() {
    if let timeToken {
      ref.removeTimeObserver(timeToken)
    }

    let updateInterval = interval / 1000
    let interval = CMTime(seconds: updateInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))

    timeToken = ref.addPeriodicTimeObserver(forInterval: interval, queue: nil) { [weak self] time in
      guard let self else {
        return
      }

      self.updateStatus(with: [
        "currentTime": time.seconds
      ])
    }
  }

  var volume: Float {
    get { ref.volume }
    set { ref.volume = newValue }
  }

  func pause() {
    ref.pause()
  }

  func resumePlayback() {
    ref.play()
  }

  public override func sharedObjectWillRelease() {
    ref.currentItem?.cancelPendingSeeks()
    owningRegistry?.remove(self)

    if isActiveForLockScreen {
      MediaController.shared.setActivePlayer(nil)
    }

    teardownPlayer()

    audioProcessor?.invalidate()
    audioProcessor = nil
  }
}
