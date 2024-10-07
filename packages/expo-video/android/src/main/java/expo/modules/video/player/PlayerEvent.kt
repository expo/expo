package expo.modules.video.player

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.TimeUpdate
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VolumeEvent

@OptIn(UnstableApi::class)
sealed class PlayerEvent {
  open val name: String = ""
  open val arguments: Array<out Any?> = arrayOf()

  data class StatusChanged(val status: PlayerStatus, val oldStatus: PlayerStatus?, val error: PlaybackError?) : PlayerEvent() {
    override val name = "statusChange"
    override val arguments = arrayOf(status, oldStatus, error)
  }

  data class IsPlayingChanged(val isPlaying: Boolean, val oldIsPlaying: Boolean?) : PlayerEvent() {
    override val name = "playingChange"
    override val arguments = arrayOf(isPlaying, oldIsPlaying)
  }

  data class VolumeChanged(val newValue: VolumeEvent, val oldValue: VolumeEvent?) : PlayerEvent() {
    override val name = "volumeChange"
    override val arguments = arrayOf(newValue, oldValue)
  }

  data class SourceChanged(val source: VideoSource?, val oldSource: VideoSource?) : PlayerEvent() {
    override val name = "sourceChange"
    override val arguments = arrayOf(source, oldSource)
  }

  data class PlaybackRateChanged(val rate: Float, val oldRate: Float?) : PlayerEvent() {
    override val name = "playbackRateChange"
    override val arguments = arrayOf(rate, oldRate)
  }

  data class TimeUpdated(val timeUpdate: TimeUpdate) : PlayerEvent() {
    override val name = "timeUpdate"
    override val arguments = arrayOf(timeUpdate)
  }

  class PlayedToEnd : PlayerEvent() {
    override val name = "playToEnd"
  }

  fun emit(player: VideoPlayer, listeners: List<VideoPlayerListener>) {
    when (this) {
      is StatusChanged -> listeners.forEach { it.onStatusChanged(player, status, oldStatus, error) }
      is IsPlayingChanged -> listeners.forEach { it.onIsPlayingChanged(player, isPlaying, oldIsPlaying) }
      is VolumeChanged -> listeners.forEach { it.onVolumeChanged(player, newValue, oldValue) }
      is SourceChanged -> listeners.forEach { it.onSourceChanged(player, source, oldSource) }
      is PlaybackRateChanged -> listeners.forEach { it.onPlaybackRateChanged(player, rate, oldRate) }
      is TimeUpdated -> listeners.forEach { it.onTimeUpdate(player, timeUpdate) }
      is PlayedToEnd -> listeners.forEach { it.onPlayedToEnd(player) }
    }
  }
}
