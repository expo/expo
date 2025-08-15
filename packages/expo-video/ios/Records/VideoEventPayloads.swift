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

internal struct SubtitleTracksChangedEventPayload: Record {
  @Field var availableSubtitleTracks: [SubtitleTrack] = []
  @Field var oldAvailableSubtitleTracks: [SubtitleTrack] = []
}

internal struct SubtitleTrackChangedEventPayload: Record {
  @Field var subtitleTrack: SubtitleTrack? = nil
  @Field var oldSubtitleTrack: SubtitleTrack? = nil
}

internal struct AudioTracksChangedEventPayload: Record {
  @Field var availableAudioTracks: [AudioTrack] = []
  @Field var oldAvailableAudioTracks: [AudioTrack] = []
}

internal struct AudioTrackChangedEventPayload: Record {
  @Field var audioTrack: AudioTrack? = nil
  @Field var oldAudioTrack: AudioTrack? = nil
}

internal struct TimeUpdate: Record {
  @Field var currentTime: Double = 0
  @Field var currentLiveTimestamp: Double? = nil
  @Field var currentOffsetFromLive: Double? = nil
  @Field var bufferedPosition: Double = -1
}

internal struct  VideoTrackChangedEventPayload: Record {
  @Field var videoTrack: VideoTrack? = nil
  @Field var oldVideoTrack: VideoTrack? = nil
}

internal struct VideoSourceLoadedEventPayload: Record {
  @Field var videoSource: VideoSource? = nil
  @Field var duration: Double? = nil
  @Field var availableVideoTracks: [VideoTrack]? = nil
  @Field var availableSubtitleTracks: [SubtitleTrack]? = nil
  @Field var availableAudioTracks: [AudioTrack]? = nil
}

internal struct IsExternalPlaybackActiveEventPayload: Record {
  @Field var isExternalPlaybackActive: Bool = false
  @Field var oldIsExternalPlaybackActive: Bool? = nil
}

// swiftlint:enable redundant_optional_initialization
