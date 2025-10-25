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

  /// Updates the available audio tracks for a new AVPlayerItem and returns an event with the changes.
  ///
  /// - Parameter playerItem: The new `AVPlayerItem` from which to load audio tracks.
  /// - Returns: A js-ready `AudioTracksChangedEventPayload` containing the list of audio tracks before and after the update.
  func onNewPlayerItemLoaded(playerItem: AVPlayerItem?) async -> AudioTracksChangedEventPayload {
    let oldAvailableAudioTracks = availableAudioTracks

    do {
      availableAudioTracks = try await Self.findAvailableAudioTracks(for: playerItem)
    } catch {
      let uri = (playerItem as? VideoPlayerItem)?.videoSource.uri?.absoluteString ?? "the current source"
      owner?.appContext?.jsLogger.warn("Failed to load available audio tracks for \(uri). Error: \(error)")
      availableAudioTracks = []
    }

    return AudioTracksChangedEventPayload(
      availableAudioTracks: availableAudioTracks,
      oldAvailableAudioTracks: oldAvailableAudioTracks
    )
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

  private static func findAvailableAudioTracks(for playerItem: AVPlayerItem?) async throws -> [AudioTrack] {
    var availableAudioTracks: [AudioTrack] = []

    guard let asset = await playerItem?.asset else {
      return availableAudioTracks
    }

    let mediaSelectionCharacteristics = try await asset.load(.availableMediaCharacteristicsWithMediaSelectionOptions)

    for characteristic in mediaSelectionCharacteristics {
      guard characteristic == .audible else {
        continue
      }

      if let group = try await asset.loadMediaSelectionGroup(for: characteristic) {
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

  static func findCurrentAudioTrack(for playerItem: AVPlayerItem?) async -> AudioTrack? {
    guard
      let currentItem = playerItem,
      let mediaSelectionGroup = try? await currentItem.asset.loadMediaSelectionGroup(for: .audible),
      let selectedMediaOption = await currentItem.currentMediaSelection.selectedMediaOption(in: mediaSelectionGroup)
    else {
      return nil
    }

    return AudioTrack.from(mediaSelectionOption: selectedMediaOption)
  }
}
