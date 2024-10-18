package expo.modules.video.player

import androidx.annotation.OptIn
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.records.IsPlayingEventPayload
import expo.modules.video.records.MutedChangedEventPayload
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.PlaybackRateChangedEventPayload
import expo.modules.video.records.SourceChangedEventPayload
import expo.modules.video.records.StatusChangedEventPayload
import expo.modules.video.records.TimeUpdate
import expo.modules.video.records.VideoEventPayload
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VolumeChangedEventPayload

@OptIn(UnstableApi::class)
sealed class PlayerEvent {
  open val name: String = ""
  open val jsEventPayload: VideoEventPayload? = null
  open val emitToJS: Boolean = true

  data class StatusChanged(val status: PlayerStatus, val oldStatus: PlayerStatus?, val error: PlaybackError?) : PlayerEvent() {
    override val name = "statusChange"
    override val jsEventPayload = StatusChangedEventPayload(status, oldStatus, error)
  }

  data class IsPlayingChanged(val isPlaying: Boolean, val oldIsPlaying: Boolean?) : PlayerEvent() {
    override val name = "playingChange"
    override val jsEventPayload = IsPlayingEventPayload(isPlaying, oldIsPlaying)
  }

  data class VolumeChanged(val volume: Float, val oldVolume: Float?) : PlayerEvent() {
    override val name = "volumeChange"
    override val jsEventPayload = VolumeChangedEventPayload(volume, oldVolume)
  }

  data class MutedChanged(val muted: Boolean, val oldMuted: Boolean?) : PlayerEvent() {
    override val name = "mutedChange"
    override val jsEventPayload = MutedChangedEventPayload(muted, oldMuted)
  }

  data class SourceChanged(val source: VideoSource?, val oldSource: VideoSource?) : PlayerEvent() {
    override val name = "sourceChange"
    override val jsEventPayload = SourceChangedEventPayload(source, oldSource)
  }

  data class PlaybackRateChanged(val rate: Float, val oldRate: Float?) : PlayerEvent() {
    override val name = "playbackRateChange"
    override val jsEventPayload = PlaybackRateChangedEventPayload(rate, oldRate)
  }

  data class TracksChanged(val tracks: Tracks) : PlayerEvent() {
    override val name = "tracksChange"
    override val emitToJS = false
  }

  data class TimeUpdated(val timeUpdate: TimeUpdate) : PlayerEvent() {
    override val name = "timeUpdate"
    override val jsEventPayload = timeUpdate
  }

  class PlayedToEnd : PlayerEvent() {
    override val name = "playToEnd"
  }

  fun emit(player: VideoPlayer, listeners: List<VideoPlayerListener>) {
    when (this) {
      is StatusChanged -> listeners.forEach { it.onStatusChanged(player, status, oldStatus, error) }
      is IsPlayingChanged -> listeners.forEach { it.onIsPlayingChanged(player, isPlaying, oldIsPlaying) }
      is VolumeChanged -> listeners.forEach { it.onVolumeChanged(player, volume, oldVolume) }
      is SourceChanged -> listeners.forEach { it.onSourceChanged(player, source, oldSource) }
      is PlaybackRateChanged -> listeners.forEach { it.onPlaybackRateChanged(player, rate, oldRate) }
      is TracksChanged -> listeners.forEach { it.onTracksChanged(player, tracks) }
      is TimeUpdated -> listeners.forEach { it.onTimeUpdate(player, timeUpdate) }
      is PlayedToEnd -> listeners.forEach { it.onPlayedToEnd(player) }
      is MutedChanged -> listeners.forEach { it.onMutedChanged(player, muted, oldMuted) }
    }
  }
}
