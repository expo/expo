import Combine
import ExpoModulesCore
import MediaPlayer

private let playbackStatus = "onPlaybackStatusUpdate"
private let audioSample = "onAudioSampleUpdate"

public class AudioPlayer: SharedRef<AVPlayer> {
  let id = UUID().uuidString
  var isLooping = false
  var shouldCorrectPitch = false
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .varispeed
  var currentRate: Float = 0.0
  let interval: Double

  // MARK: Observers
  private var timeToken: Any?
  private var cancellables = Set<AnyCancellable>()
  private var endObserver: NSObjectProtocol?

  private var audioProcessor: AudioTapProcessor?
  private var samplingEnabled = false
  private var tapInstalled = false

  private let nowPlayingInfoController: NowPlayingInfoControllerProtocol
  private let remoteCommandController: RemoteCommandController

  var enableLockScreenControls: Bool {
    didSet {
      if enableLockScreenControls {
        initNotificationCenter()
      } else {
        removeLockScreenControls()
      }
    }
  }

  init(_ ref: AVPlayer, interval: Double, enableLockScreenControls: Bool) {
    self.interval = interval
    self.enableLockScreenControls = enableLockScreenControls
    self.nowPlayingInfoController = NowPlayingInfoController()
    self.remoteCommandController = RemoteCommandController()

    super.init(ref)
    self.remoteCommandController.audioPlayer = self

    if enableLockScreenControls {
      initNotificationCenter()
    }
    setupPublisher()
  }

  var isLoaded: Bool {
    ref.currentItem?.status == .readyToPlay
  }

  var playing: Bool {
    ref.timeControlStatus == .playing
  }

  var isBuffering: Bool {
    playerIsBuffering()
  }

  func play(at rate: Float) {
    do {
      try audioSession.setCategory(.playback, mode: .default)
      try audioSession.setActive(true)
    } catch {
      print("Failed to set audio session category: \(error)")
    }

    addPlaybackEndNotification()
    registerTimeObserver()
    ref.playImmediately(atRate: rate)
    if enableLockScreenControls {
      updateNowPlayingInfo()
    }
  }

  func initNotificationCenter() {
    // Reset playback values
    nowPlayingInfoController.setWithoutUpdate(keyValues: [
      MediaItemProperty.duration(nil),
      NowPlayingInfoProperty.playbackRate(nil),
      NowPlayingInfoProperty.elapsedPlaybackTime(nil),
    ])
    loadNowPlayingMetaValues()
    setupRemoteTransportControls()
  }

  public func loadNowPlayingMetaValues() {
    guard let item = ref.currentItem else { return }

    let duration = item.duration.isNumeric ? item.duration.seconds : 0
    let title = "Your Audio Title"  // Replace with actual title
    let artist = "Artist Name"  // Replace with actual artist name
    let albumTitle = "Album Name"  // Replace with actual album name

    nowPlayingInfoController.set(keyValues: [
      MediaItemProperty.artist(artist),
      MediaItemProperty.title(title),
      MediaItemProperty.albumTitle(albumTitle),
      MediaItemProperty.duration(duration),
      NowPlayingInfoProperty.playbackRate(Double(ref.rate)),
      NowPlayingInfoProperty.elapsedPlaybackTime(item.currentTime().seconds),
    ])

    // You can add artwork here if available
    // if let artwork = MPMediaItemArtwork(/* your artwork */) {
    //     nowPlayingInfoController.set(keyValue: MediaItemProperty.artwork(artwork))
    // }
  }

  private func setupRemoteTransportControls() {
    let commandCenter = MPRemoteCommandCenter.shared()

    commandCenter.playCommand.addTarget { [weak self] _ in
      self?.play(at: 1.0)
      return .success
    }

    commandCenter.pauseCommand.addTarget { [weak self] _ in
      self?.ref.pause()
      return .success
    }

    commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
      if self?.playing == true {
        self?.ref.pause()
      } else {
        self?.play(at: 1.0)
      }
      return .success
    }

    // Add more commands as needed (e.g., skip, seek)
  }

  private func removeRemoteTransportControls() {
    let commandCenter = MPRemoteCommandCenter.shared()

    commandCenter.playCommand.removeTarget(self)
    commandCenter.pauseCommand.removeTarget(self)
    commandCenter.togglePlayPauseCommand.removeTarget(self)

    // Remove other commands if added
  }

  func setSamplingEnabled(enabled: Bool) {
    samplingEnabled = enabled
    if enabled {
      installTap()
    } else {
      uninstallTap()
    }
  }

  func currentStatus() -> [String: Any] {
    let time = ref.currentItem?.duration
    let duration = ref.status == .readyToPlay ? (time?.seconds ?? 0.0) : 0.0
    return [
      "id": id,
      "currentTime": (ref.currentItem?.currentTime().seconds ?? 0) * 1000,
      "playbackState": statusToString(status: ref.status),
      "timeControlStatus": timeControlStatusString(status: ref.timeControlStatus),
      "reasonForWaitingToPlay": reasonForWaitingToPlayString(status: ref.reasonForWaitingToPlay),
      "mute": ref.isMuted,
      "duration": duration * 1000,
      "playing": ref.timeControlStatus == .playing,
      "loop": isLooping,
      "isLoaded": ref.currentItem?.status == .readyToPlay,
      "playbackRate": ref.rate,
      "shouldCorrectPitch": shouldCorrectPitch,
      "isBuffering": isBuffering,
    ]
  }

  func updateStatus(with dict: [String: Any]) {
    var body = currentStatus()
    body.merge(dict) { _, new in
      new
    }
    self.emit(event: playbackStatus, arguments: body)
  }

  private func setupPublisher() {
    ref.publisher(for: \.currentItem?.status)
      .sink { status in
        guard let status else {
          return
        }
        if status == .readyToPlay {
          self.updateStatus(with: [
            "isLoaded": true
          ])
        }
      }
      .store(in: &cancellables)
  }

  private func playerIsBuffering() -> Bool {
    let isPlaying = ref.timeControlStatus == .playing

    if isPlaying {
      return false
    }

    if ref.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      return true
    }

    if let currentItem = ref.currentItem {
      return currentItem.isPlaybackLikelyToKeepUp && currentItem.isPlaybackBufferEmpty
    }
    return true
  }

  private func installTap() {
    if let item = ref.currentItem, !tapInstalled {
      audioProcessor = AudioTapProcessor(playerItem: item)
      tapInstalled = audioProcessor?.installTap() ?? false
      audioProcessor?.sampleBufferCallback = { [weak self] buffer, frameCount, timestamp in
        guard let self,
          let audioBuffer = buffer?.pointee,
          let data = audioBuffer.mData,
          samplingEnabled
        else {
          return
        }

        let channelCount = Int(audioBuffer.mNumberChannels)
        let dataPointer = data.assumingMemoryBound(to: Float.self)

        let channels = (0..<channelCount).map { channelIndex in
          let channelData = stride(from: channelIndex, to: frameCount, by: channelCount).map {
            frameIndex in
            dataPointer[frameIndex]
          }
          return ["frames": channelData]
        }

        self.emit(
          event: audioSample,
          arguments: [
            "channels": channels,
            "timestamp": timestamp,
          ])
      }
    }
  }

  private func uninstallTap() {
    tapInstalled = false
    audioProcessor?.uninstallTap()
    audioProcessor?.sampleBufferCallback = nil
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
          "isPlaying": false
        ])
      }
    }
  }

  private func registerTimeObserver() {
    let updateInterval = interval / 1000
    let interval = CMTime(seconds: updateInterval, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeToken = ref.addPeriodicTimeObserver(forInterval: interval, queue: nil) { [weak self] time in
      self?.updateStatus(with: [
        "currentPosition": time.seconds * 1000
      ])
      self?.updateNowPlayingInfo()
    }
  }

  private var audioSession: AVAudioSession {
    AVAudioSession.sharedInstance()
  }

  private func updateNowPlayingInfo() {
    guard let item = ref.currentItem else { return }

    nowPlayingInfoController.set(keyValues: [
      NowPlayingInfoProperty.playbackRate(Double(ref.rate)),
      NowPlayingInfoProperty.elapsedPlaybackTime(item.currentTime().seconds),
    ])
  }

  private func removeLockScreenControls() {
    removeRemoteTransportControls()
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
  }

  public override func sharedObjectWillRelease() {
    AudioComponentRegistry.shared.remove(self)
    setSamplingEnabled(enabled: false)
    if let token = timeToken {
      ref.removeTimeObserver(token as Any)
    }
    NotificationCenter.default.removeObserver(endObserver as Any)
    ref.pause()
    if enableLockScreenControls {
      removeLockScreenControls()
    }
  }
}
