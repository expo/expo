import ExpoModulesCore
import Foundation

private let playbackStatus = "onPlaybackStatusUpdate"

public class AudioPlayer: SharedRef<AVPlayer> {
  var id = UUID().uuidString
  var isLooping = false
  var shouldCorrectPitch = false
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .varispeed
  var currentRate: Float = 0.0

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

  func updateStatus(with dict: [String: Any]) {
    var body: [String: Any] = [
      "id": id,
      "currentTime": (ref.currentItem?.currentTime().seconds ?? 0) * 1000,
      "status": statusToString(status: ref.status),
      "timeControlStatus": timeControlStatusString(status: ref.timeControlStatus),
      "reasonForWaitingToPlay": reasonForWaitingToPlayString(status: ref.reasonForWaitingToPlay),
      "mute": ref.isMuted,
      "duration": (ref.currentItem?.duration.seconds ?? 0) * 1000,
      "playing": ref.timeControlStatus == .playing,
      "loop": isLooping,
      "isLoaded": ref.currentItem?.status == .readyToPlay,
      "playbackRate": ref.rate,
      "shouldCorrectPitch": shouldCorrectPitch,
      "isBuffering": isBuffering
    ]

    body.merge(dict) { _, new in
      new
    }
    self.emit(event: playbackStatus, arguments: body)
  }
}
