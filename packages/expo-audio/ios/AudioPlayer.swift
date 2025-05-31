import ExpoModulesCore
import Combine

private enum AudioConstants {
  static let playbackStatus = "playbackStatusUpdate"
  static let audioSample = "audioSampleUpdate"
}

public class AudioPlayer: SharedRef<AVPlayer> {
  let id = UUID().uuidString
  var isLooping = false
  var shouldCorrectPitch = false
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .varispeed
  var currentRate: Float = 0.0
  let interval: Double
  var wasPlaying = false
  var isPaused: Bool {
    ref.rate == 0.0
  }
  var samplingEnabled = false

  // MARK: Observers
  private var timeToken: Any?
  private var cancellables = Set<AnyCancellable>()
  private var endObserver: NSObjectProtocol?

  private var audioProcessor: AudioTapProcessor?
  private var tapInstalled = false
  private var shouldInstallAudioTap = false

  var duration: Double {
    ref.currentItem?.duration.seconds ?? 0.0
  }

  var currentTime: Double {
    ref.currentItem?.currentTime().seconds ?? 0.0
  }

  init(_ ref: AVPlayer, interval: Double) {
    self.interval = interval
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
    playerIsBuffering()
  }

  func play(at rate: Float) {
    addPlaybackEndNotification()
    registerTimeObserver()
    ref.playImmediately(atRate: rate)
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
      "playbackRate": ref.rate,
      "shouldCorrectPitch": shouldCorrectPitch,
      "isBuffering": isBuffering
    ]
  }

  func updateStatus(with dict: [String: Any]) {
    var arguments = currentStatus()
    arguments.merge(dict) { _, new in
      new
    }
    self.emit(event: AudioConstants.playbackStatus, arguments: arguments)
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
        if self.samplingEnabled && self.isLoaded {
          self.installTap()
        }
      }
      .store(in: &cancellables)
  }

  func replaceCurrentSource(source: AudioSource) {
    let wasPlaying = ref.timeControlStatus == .playing
    let wasSamplingEnabled = samplingEnabled
    ref.pause()

    // Remove the audio tap if it is active
    if samplingEnabled {
      uninstallTap()
    }
    ref.replaceCurrentItem(with: AudioUtils.createAVPlayerItem(from: source))

    if wasSamplingEnabled {
      shouldInstallAudioTap = true
    }

    if wasPlaying {
      ref.play()
    }
  }

  private func playerIsBuffering() -> Bool {
    if isPlaying {
      return false
    }

    if ref.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      return true
    }

    if let currentItem = ref.currentItem {
      return !currentItem.isPlaybackLikelyToKeepUp && currentItem.isPlaybackBufferEmpty
    }
    return true
  }

  private func installTap() {
    guard isLoaded else {
      shouldInstallAudioTap = true
      return
    }

    guard !tapInstalled else {
      return
    }

    if audioProcessor != nil {
      uninstallTap()
    }

    audioProcessor = AudioTapProcessor(player: ref)
    tapInstalled = audioProcessor?.installTap() ?? false

    if tapInstalled {
      audioProcessor?.sampleBufferCallback = { [weak self] buffer, frameCount, timestamp in
        guard let self,
        let audioBuffer = buffer?.pointee,
        let data = audioBuffer.mData,
        samplingEnabled else {
          return
        }

        let channelCount = Int(audioBuffer.mNumberChannels)
        let dataPointer = data.assumingMemoryBound(to: Float.self)

        let channels = (0..<channelCount).map { channelIndex in
          let channelData = stride(from: channelIndex, to: frameCount, by: channelCount).map { frameIndex in
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
    audioProcessor?.sampleBufferCallback = nil
    audioProcessor?.uninstallTap()
  }

  private func addPlaybackEndNotification() {
    if let previous = endObserver {
      NotificationCenter.default.removeObserver(previous)
    }
    endObserver = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: ref.currentItem,
      queue: nil
    ) { _ in
      if self.isLooping {
        self.ref.seek(to: CMTime.zero)
        self.ref.play()
      } else {
        self.updateStatus(with: [
          "isPlaying": false,
          "currentTime": self.duration,
          "didJustFinish": true
        ])
      }
    }
  }

  private func registerTimeObserver() {
    let updateInterval = interval / 1000
    let interval = CMTime(seconds: updateInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeToken = ref.addPeriodicTimeObserver(forInterval: interval, queue: nil) { time in
      self.updateStatus(with: [
        "currentTime": time.seconds
      ])
    }
  }

  public override func sharedObjectWillRelease() {
    cancellables.removeAll()

    if samplingEnabled {
      samplingEnabled = false
      uninstallTap()
    }

    AudioComponentRegistry.shared.remove(self)

    if let token = timeToken {
      ref.removeTimeObserver(token as Any)
    }

    if let endObserver {
      NotificationCenter.default.removeObserver(endObserver)
    }

    ref.pause()
  }
}
