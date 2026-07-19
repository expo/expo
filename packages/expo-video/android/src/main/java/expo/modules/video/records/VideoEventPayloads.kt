package expo.modules.video.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.enums.PlayerStatus
import java.io.Serializable

interface VideoEventPayload : Record, Serializable

class StatusChangedEventPayload(
  @Field val status: PlayerStatus,
  @Field val oldStatus: PlayerStatus?,
  @Field val error: PlaybackError?
) : VideoEventPayload

class IsPlayingEventPayload(
  @Field val isPlaying: Boolean,
  @Field val oldIsPlaying: Boolean?
) : VideoEventPayload

class VolumeChangedEventPayload(
  @Field val volume: Float,
  @Field val oldVolume: Float?
) : VideoEventPayload

class MutedChangedEventPayload(
  @Field val muted: Boolean,
  @Field val oldMuted: Boolean?
) : VideoEventPayload

class SourceChangedEventPayload(
  @Field val source: VideoSource?,
  @Field val oldSource: VideoSource?
) : VideoEventPayload

class PlaybackRateChangedEventPayload(
  @Field val playbackRate: Float,
  @Field val oldPlaybackRate: Float?
) : VideoEventPayload

class TimeUpdate(
  @Field var currentTime: Double = .0,
  @Field var currentOffsetFromLive: Float?,
  @Field var currentLiveTimestamp: Long?,
  @Field var bufferedPosition: Double = .0
) : VideoEventPayload

class SubtitleTrackChangedEventPayload(
  @Field val subtitleTrack: SubtitleTrack?,
  @Field val oldSubtitleTrack: SubtitleTrack?
) : VideoEventPayload

class AudioTrackChangedEventPayload(
  @Field val audioTrack: AudioTrack?,
  @Field val oldAudioTrack: AudioTrack?
) : VideoEventPayload

class VideoTrackChangedEventPayload(
  @Field val videoTrack: VideoTrack?,
  @Field val oldVideoTrack: VideoTrack?
) : VideoEventPayload

class AvailableSubtitleTracksChangedEventPayload(
  @Field val availableSubtitleTracks: List<SubtitleTrack>,
  @Field val oldAvailableSubtitleTracks: List<SubtitleTrack>
) : VideoEventPayload

class AvailableAudioTracksChangedEventPayload(
  @Field val availableAudioTracks: List<AudioTrack>,
  @Field val oldAvailableAudioTracks: List<AudioTrack>
) : VideoEventPayload

class VideoSourceLoadedEventPayload(
  @Field val videoSource: VideoSource?,
  @Field val duration: Double,
  @Field val availableVideoTracks: List<VideoTrack>,
  @Field val availableSubtitleTracks: List<SubtitleTrack>,
  @Field val availableAudioTracks: List<AudioTrack>
) : VideoEventPayload
