import ExpoModulesCore
import Foundation

public class AudioPlayer: SharedRef<AVPlayer>, Identifiable {
  public var id = UUID().uuidString
  var isLooping = false
  var shouldCorrectPitch = false
  var pitchCorrectionQuality: AVAudioTimePitchAlgorithm = .varispeed

  var isLoaded: Bool {
    pointer.currentItem?.status == .readyToPlay
  }
  var isPlaying: Bool {
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
    } else if avPlayer.timeControlStatus == .waitingToPlayAtSpecifiedRate {
      return true
    } else {
      if let currentItem = avPlayer.currentItem {
        return currentItem.isPlaybackLikelyToKeepUp && currentItem.isPlaybackBufferEmpty
      } else {
        return true
      }
    }
  }
}
