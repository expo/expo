import ExpoModulesCore
import AVFoundation
import Combine

class AVPlayerBackend: AudioPlayerBackendProtocol {
  let id: String
  let interval: Double
  
  var shouldCorrectPitch = true {
    didSet {
      updateStatus(with: [:])
    }
  }
  
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .timeDomain {
    didSet {
      ref.currentItem?.audioTimePitchAlgorithm = pitchCorrectionQuality
    }
  }
  
  var currentRate: Float = 1.0 {
    didSet {
      currentRate = max(0, currentRate)
    }
  }
  
  var isPaused: Bool {
    ref.rate == 0.0
  }
  
  var samplingEnabled = false
  
  var isLooping = false {
    didSet {
      guard isLooping != oldValue else { return }
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
  
  var volume: Float {
    get { ref.volume }
    set { ref.volume = newValue }
  }

  var isMuted: Bool {
    get { ref.isMuted }
    set { ref.isMuted = newValue }
  }

  var pitch: Float {
    get { return 0.0 }
    set {
      if newValue != 0.0 {
        log.warn("[expo-audio] Pitch shifting is not supported on iOS when using AVPlayer.")
      }
    }
  }

  var supportsPitchCorrectionQuality: Bool { true }
  var isAudioSamplingSupported: Bool {
    guard let source = source, let url = source.uri else { return false }
    return !url.absoluteString.contains(".m3u8")
  }

  var duration: Double {
    let seconds = ref.currentItem?.duration.seconds ?? 0.0
    return seconds.isNaN ? 0.0 : seconds
  }
  
  var currentTime: Double {
    let seconds = ref.currentItem?.currentTime().seconds ?? 0.0
    return seconds.isNaN ? 0.0 : seconds
  }
  
  var isLive: Bool {
    ref.currentItem?.duration.isIndefinite ?? false
  }
  
  var currentOffsetFromLive: Double? {
    guard let currentDate = ref.currentItem?.currentDate() else { return nil }
    return Date().timeIntervalSince1970 - currentDate.timeIntervalSince1970
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

  var onPlaybackComplete: (() -> Void)?
  var onStatusUpdate: (([String: Any]) -> Void)?
  var onAudioSample: (([String: Any]) -> Void)?

  var lockScreenPlayer: AVPlayer? {
    ref
  }

  private var ref: AVPlayer
  private var source: AudioSource?
  private var timeToken: Any?
  private var cancellables = Set<AnyCancellable>()
  private var endObserver: NSObjectProtocol?
  
  private var audioProcessor: AudioTapProcessor?
  private var tapInstalled = false
  private var shouldInstallAudioTap = false

  init(id: String, interval: Double, source: AudioSource?, preloadedPlayer: AVPlayer? = nil) {
    self.id = id
    self.interval = interval
    self.source = source
    if let preloaded = preloadedPlayer {
      self.ref = preloaded
    } else {
      self.ref = source != nil ? AudioUtils.createAVPlayer(from: source!) : AVPlayer()
    }
    setupPublisher()
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
  }

  func pause() {
    ref.pause()
  }

  func resumePlayback() {
    ref.play()
  }

  func seekTo(seconds: Double, toleranceMillisBefore: Double?, toleranceMillisAfter: Double?) async {
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
          self.updateStatus(with: ["currentTime": self.currentTime])
        }
        continuation.resume()
      }
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
    item?.audioTimePitchAlgorithm = pitchCorrectionQuality
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

  func teardown() {
    ref.currentItem?.cancelPendingSeeks()
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
    audioProcessor?.invalidate()
    audioProcessor = nil
  }

  func currentStatus() -> [String: Any] {
    let currentDuration = ref.status == .readyToPlay ? duration : 0.0
    let rate = isPlaying ? ref.rate : currentRate
    return [
      "playbackState": statusToString(status: ref.status),
      "timeControlStatus": timeControlStatusString(status: ref.timeControlStatus),
      "reasonForWaitingToPlay": reasonForWaitingToPlayString(status: ref.reasonForWaitingToPlay),
      "mute": ref.isMuted,
      "duration": currentDuration,
      "playing": isPlaying,
      "isLoaded": isLoaded,
      "playbackRate": rate,
      "isBuffering": isBuffering,
      "isLive": isLive,
      "currentOffsetFromLive": currentOffsetFromLive as Any,
      "error": nil as Any? as Any
    ]
  }

  func updateStatus(with dict: [String: Any]) {
    var arguments = currentStatus()
    arguments.merge(dict) { _, new in new }
    onStatusUpdate?(arguments)
  }

  private func setupPublisher() {
    ref.publisher(for: \.currentItem?.status)
      .sink { [weak self] status in
        guard let self, let status else { return }
        if status == .readyToPlay {
          self.updateStatus(with: ["isLoaded": true])
          if self.isLooping {
            self.enqueueNextLoopItem()
          }
          if shouldInstallAudioTap || samplingEnabled {
            installTap()
            shouldInstallAudioTap = false
          }
        }
        if status == .failed {
          self.updateStatus(with: [
            "error": self.ref.currentItem?.error?.localizedDescription ?? "Unknown error"
          ])
        }
      }
      .store(in: &cancellables)

    ref.publisher(for: \.currentItem)
      .sink { [weak self] _ in
        guard let self else { return }
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

  private func onReady(_ completion: @escaping () -> Void) {
    ref.publisher(for: \.currentItem?.status)
      .compactMap { $0 }
      .filter { $0 == .readyToPlay }
      .first()
      .sink { _ in completion() }
      .store(in: &cancellables)
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
    guard queuePlayer.items().count <= 1 else { return }
    let nextItem = AVPlayerItem(asset: currentItem.asset)
    nextItem.audioTimePitchAlgorithm = currentItem.audioTimePitchAlgorithm
    queuePlayer.insert(nextItem, after: currentItem)
  }

  private func removeQueuedLoopItems() {
    guard let queuePlayer = ref as? AVQueuePlayer else { return }
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
      guard let self, let finishedItem = notification.object as? AVPlayerItem else { return }
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
    let intervalTime = CMTime(seconds: updateInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeToken = ref.addPeriodicTimeObserver(forInterval: intervalTime, queue: nil) { [weak self] time in
      guard let self else { return }
      self.updateStatus(with: ["currentTime": time.seconds])
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
          self.samplingEnabled else { return }

        let channelCount = Int(audioBuffer.mNumberChannels)
        let dataPointer = data.assumingMemoryBound(to: Float.self)
        let channels = (0..<channelCount).map { channelIndex in
          let channelData = stride(from: channelIndex, to: Int(frameCount), by: channelCount).map { frameIndex in
            dataPointer[frameIndex]
          }
          return ["frames": channelData]
        }
        self.onAudioSample?([
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
}
