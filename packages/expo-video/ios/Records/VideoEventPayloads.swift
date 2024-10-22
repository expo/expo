import Foundation
import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct StatusChangedEventPayload: Record {
  @Field var status: PlayerStatus = .idle
  @Field var oldStatus: PlayerStatus? = nil
  @Field var error: PlaybackError? = nil
}

internal struct IsPlayingEventPayload: Record {
  @Field var isPlaying: Bool = false
  @Field var oldIsPlaying: Bool? = nil
}

internal struct VolumeChangedEventPayload: Record {
  @Field var volume: Float = 1
  @Field var oldVolume: Float? = nil
}

internal struct MutedChangedEventPayload: Record {
  @Field var muted: Bool = false
  @Field var oldMuted: Bool? = nil
}

internal struct SourceChangedEventPayload: Record {
  @Field var source: VideoSource? = nil
  @Field var oldSource: VideoSource? = nil
}

internal struct PlaybackRateChangedEventPayload: Record {
  @Field var playbackRate: Float = 1
  @Field var oldPlaybackRate: Float? = nil
}

internal struct TimeUpdate: Record {
  @Field var currentTime: Double = 0
  @Field var currentLiveTimestamp: Double? = nil
  @Field var currentOffsetFromLive: Double? = nil
  @Field var bufferedPosition: Double = -1
}

// swiftlint:enable redundant_optional_initialization
