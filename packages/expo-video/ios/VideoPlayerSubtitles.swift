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

  /// Updates the available subtitle tracks for a new player item and returns an event with the changes.
  ///
  /// - Parameter playerItem: The new `AVPlayerItem` from which to load subtitle tracks.
  /// - Returns: A js-ready `SubtitleTracksChangedEventPayload` containing the list of subtitle tracks before and after the update.
  func onNewPlayerItemLoaded(playerItem: AVPlayerItem?) async -> SubtitleTracksChangedEventPayload {
    let oldAvailableSubtitleTracks = availableSubtitleTracks

    do {
      availableSubtitleTracks = try await Self.findAvailableSubtitleTracks(for: playerItem)
    } catch {
      let uri = (playerItem as? VideoPlayerItem)?.videoSource.uri?.absoluteString ?? "the current source"
      owner?.appContext?.jsLogger.warn("Failed to load available subtitle tracks for \(uri). Error: \(error)")
      availableSubtitleTracks = []
    }

    return SubtitleTracksChangedEventPayload(
      availableSubtitleTracks: availableSubtitleTracks,
      oldAvailableSubtitleTracks: oldAvailableSubtitleTracks
    )
  }

  func selectSubtitleTrack(subtitleTrack: SubtitleTrack?) {
    guard let currentItem = self.owner?.ref.currentItem else {
      return
    }

    if let group = currentItem.asset.mediaSelectionGroup(forMediaCharacteristic: .legible) {
      let option = group.options.first {
        $0.displayName == subtitleTrack?.label && $0.locale?.identifier == subtitleTrack?.language
      }
      currentItem.select(option, in: group)
    }
  }

  private static func findAvailableSubtitleTracks(for playerItem: AVPlayerItem?) async throws -> [SubtitleTrack] {
    var availableSubtitleTracks: [SubtitleTrack] = []

    guard let asset = await playerItem?.asset else {
      return availableSubtitleTracks
    }
    let mediaSelectionCharacteristics = try await asset.load(.availableMediaCharacteristicsWithMediaSelectionOptions)

    for characteristic in mediaSelectionCharacteristics {
      guard characteristic == .legible else {
        continue
      }

      if let group = try await asset.loadMediaSelectionGroup(for: characteristic) {
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

  static func findCurrentSubtitleTrack(for playerItem: AVPlayerItem?) async -> SubtitleTrack? {
    guard
      let currentItem = playerItem,
      let mediaSelectionGroup = try? await currentItem.asset.loadMediaSelectionGroup(for: .legible),
      let selectedMediaOption = await currentItem.currentMediaSelection.selectedMediaOption(in: mediaSelectionGroup)
    else {
      return nil
    }

    return SubtitleTrack.from(mediaSelectionOption: selectedMediaOption)
  }
}
