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
    pointer.currentItem?.status == .readyToPlay
  }

  var playing: Bool {
    pointer.timeControlStatus == .playing
  }

  var isBuffering: Bool {
    playerIsBuffering()
  }

  private func playerIsBuffering() -> Bool {
    let avPlayer = pointer
    let isPlaying = avPlayer.timeControlStatus == .playing

    if isPlaying {
      return false
    }

    if avPlayer.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      return true
    }

    if let currentItem = avPlayer.currentItem {
      return currentItem.isPlaybackLikelyToKeepUp && currentItem.isPlaybackBufferEmpty
    }
    return true
  }

  func updateStatus(with dict: [String: Any]) {
    var body: [String: Any] = [
      "id": id,
      "currentTime": (pointer.currentItem?.currentTime().seconds ?? 0) * 1000,
      "status": statusToString(status: pointer.status),
      "timeControlStatus": timeControlStatusString(status: pointer.timeControlStatus),
      "reasonForWaitingToPlay": reasonForWaitingToPlayString(status: pointer.reasonForWaitingToPlay),
      "mute": pointer.isMuted,
      "duration": (pointer.currentItem?.duration.seconds ?? 0) * 1000,
      "playing": pointer.timeControlStatus == .playing,
      "loop": isLooping,
      "isLoaded": pointer.currentItem?.status == .readyToPlay,
      "playbackRate": pointer.rate,
      "shouldCorrectPitch": shouldCorrectPitch,
      "isBuffering": isBuffering
    ]

    body.merge(dict) { _, new in
      new
    }
    self.emit(event: playbackStatus, arguments: body)
  }
}
