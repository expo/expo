import Foundation
import AVFoundation

class VideoPlayerSubtitles {
  weak var owner: VideoPlayer?
  private(set) var availableSubtitleTracks: [SubtitleTrack] = []
  private(set) var currentSubtitleTrack: SubtitleTrack?

  init (owner: VideoPlayer) {
    self.owner = owner
  }

  func onNewSubtitleTrackSelected(subtitleTrack: SubtitleTrack?) {
    currentSubtitleTrack = subtitleTrack
  }

  func onNewPlayerItemLoaded(playerItem: AVPlayerItem?) {
    availableSubtitleTracks = Self.findAvailableSubtitleTracks(for: playerItem)
  }

  func selectSubtitleTrack(subtitleTrack: SubtitleTrack?) {
    guard let currentItem = self.owner?.pointer.currentItem else {
      return
    }

    if let group = currentItem.asset.mediaSelectionGroup(forMediaCharacteristic: .legible) {
      let option = group.options.first {
        $0.displayName == subtitleTrack?.label && $0.locale?.identifier == subtitleTrack?.language
      }
      currentItem.select(option, in: group)
    }
  }

  static func findAvailableSubtitleTracks(for playerItem: AVPlayerItem?) -> [SubtitleTrack] {
    var availableSubtitleTracks: [SubtitleTrack] = []

    guard let asset = playerItem?.asset else {
      return availableSubtitleTracks
    }
    let mediaSelectionCharacteristics = asset.availableMediaCharacteristicsWithMediaSelectionOptions

    for characteristic in mediaSelectionCharacteristics {
      guard characteristic == .legible else {
        continue
      }

      if let group = asset.mediaSelectionGroup(forMediaCharacteristic: characteristic) {
        for option in group.options {
          guard let subtitleTrack = SubtitleTrack.from(mediaSelectionOption: option) else {
            continue
          }

          availableSubtitleTracks.append(subtitleTrack)
        }
      }
    }
    return availableSubtitleTracks
  }

  static func findCurrentSubtitleTrack(for playerItem: AVPlayerItem?) -> SubtitleTrack? {
    guard
      let currentItem = playerItem,
      let mediaSelectionGroup = currentItem.asset.mediaSelectionGroup(forMediaCharacteristic: .legible),
      let selectedMediaOption = currentItem.currentMediaSelection.selectedMediaOption(in: mediaSelectionGroup)
    else {
      return nil
    }

    return SubtitleTrack.from(mediaSelectionOption: selectedMediaOption)
  }
}
