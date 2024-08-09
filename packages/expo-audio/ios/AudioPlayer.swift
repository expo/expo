import ExpoModulesCore

private let playbackStatus = "onPlaybackStatusUpdate"
private let audioSample = "onAudioSampleUpdate"

public class AudioPlayer: SharedRef<AVPlayer> {
  var id = UUID().uuidString
  var isLooping = false
  var shouldCorrectPitch = false
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .varispeed
  var currentRate: Float = 0.0
  let interval: Double

  private var audioProcessor: AudioTapProcessor?
  private var samplingEnabled = false
  private var tapInstalled = false

  init(_ ref: AVPlayer, interval: Double) {
    self.interval = interval
    super.init(ref)
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
  
  func setSamplingEnabled(enabled: Bool) {
    samplingEnabled = enabled
    if enabled {
      installTap()
    } else {
      uninstallTap()
    }
  }
  
  func installTap() {
    if let item = ref.currentItem, !tapInstalled {
      audioProcessor = AudioTapProcessor(playerItem: item)
      tapInstalled = audioProcessor?.installTap() ?? false
      audioProcessor?.sampleBufferCallback = { [weak self] buffer, frameCount, timestamp in
        guard let self,
        let audioBuffer = buffer?.pointee,
        let data = audioBuffer.mData else {
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
        
        self.emit(event: audioSample, arguments: [
          "channels": channels,
          "timestamp": timestamp
        ])
      }
    }
  }
  
  func uninstallTap() {
    audioProcessor?.uninstallTap()
    audioProcessor = nil
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
      "isBuffering": isBuffering
    ]
  }

  func updateStatus(with dict: [String: Any]) {
    var body = currentStatus()
    body.merge(dict) { _, new in
      new
    }
    self.emit(event: playbackStatus, arguments: body)
  }
  
  // temporary until we have delegate methods for releasing the SharedObject
  deinit {
    uninstallTap()
  }
}
