// Copyright 2026-present 650 Industries. All rights reserved.

import CoreMedia
import ExpoMediaSession
import Foundation

/**
 * The metadata that the asset of a video carries. The metadata of the video source has priority over it.
 */
struct VideoAssetMetadata: Equatable {
  var title: String?
  var artist: String?
  var artworkData: Data?
}

enum VideoNowPlaying {
  static let skipInterval = 10.0
  static let commands: Set<RemoteCommandKind> = [.play, .pause, .togglePlayPause, .skipForward, .skipBackward, .seek]

  static func info(
    metadata: VideoMetadata?,
    asset: VideoAssetMetadata?,
    duration: CMTime,
    elapsedTime: Double,
    rate: Float
  ) -> NowPlayingInfo {
    return NowPlayingInfo(
      title: metadata?.title ?? asset?.title,
      artist: metadata?.artist ?? asset?.artist,
      artworkURL: metadata?.artwork,
      artworkData: metadata?.artwork == nil ? asset?.artworkData : nil,
      duration: duration.isNumeric ? duration.seconds : nil,
      elapsedTime: elapsedTime.isFinite ? elapsedTime : nil,
      playbackRate: Double(rate),
      isLiveStream: duration.isIndefinite,
      skipForwardInterval: skipInterval,
      skipBackwardInterval: skipInterval
    )
  }

  /**
   * Returns the position in seconds that a seek or a skip command moves the player to, or `nil` for other commands.
   */
  static func seekTarget(for command: RemoteCommand, currentTime: Double) -> Double? {
    switch command.kind {
    case .seek:
      return command.value.map { max(0, $0) }
    case .skipForward:
      return max(0, currentTime + (command.value ?? skipInterval))
    case .skipBackward:
      return max(0, currentTime - (command.value ?? skipInterval))
    default:
      return nil
    }
  }
}
