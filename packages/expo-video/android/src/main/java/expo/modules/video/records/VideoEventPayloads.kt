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
