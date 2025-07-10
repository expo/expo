import Foundation
import AVFoundation

class VideoPlayerAudioTracks {
  weak var owner: VideoPlayer?
  private(set) var availableAudioTracks: [AudioTrack] = []
  private(set) var currentAudioTrack: AudioTrack?

  init (owner: VideoPlayer) {
    self.owner = owner
  }

  func onNewAudioTrackSelected(audioTrack: AudioTrack?) {
    currentAudioTrack = audioTrack
  }

  func onNewPlayerItemLoaded(playerItem: AVPlayerItem?) {
    availableAudioTracks = Self.findAvailableAudioTracks(for: playerItem)
  }

  func selectAudioTrack(audioTrack: AudioTrack?) {
    guard let currentItem = self.owner?.ref.currentItem else {
      return
    }

    if let group = currentItem.asset.mediaSelectionGroup(forMediaCharacteristic: .audible) {
      let option = group.options.first {
        $0.displayName == audioTrack?.label && $0.locale?.identifier == audioTrack?.language
      }
      currentItem.select(option, in: group)
    }
  }

  static func findAvailableAudioTracks(for playerItem: AVPlayerItem?) -> [AudioTrack] {
    var availableAudioTracks: [AudioTrack] = []

    guard let asset = playerItem?.asset else {
      return availableAudioTracks
    }

    let mediaSelectionCharacteristics = asset.availableMediaCharacteristicsWithMediaSelectionOptions

    for characteristic in mediaSelectionCharacteristics {
      guard characteristic == .audible else {
        continue
      }

      if let group = asset.mediaSelectionGroup(forMediaCharacteristic: characteristic) {
        for option in group.options {
          guard let audioTrack = AudioTrack.from(mediaSelectionOption: option) else {
            continue
          }

          availableAudioTracks.append(audioTrack)
        }
      }
    }
    return availableAudioTracks
  }

  static func findCurrentAudioTrack(for playerItem: AVPlayerItem?) -> AudioTrack? {
    guard
      let currentItem = playerItem,
      let mediaSelectionGroup = currentItem.asset.mediaSelectionGroup(forMediaCharacteristic: .audible),
      let selectedMediaOption = currentItem.currentMediaSelection.selectedMediaOption(in: mediaSelectionGroup)
    else {
      return nil
    }

    return AudioTrack.from(mediaSelectionOption: selectedMediaOption)
  }
}
