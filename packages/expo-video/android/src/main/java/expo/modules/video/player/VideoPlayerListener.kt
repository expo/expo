package expo.modules.video.player

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VolumeEvent
import expo.modules.video.records.TimeUpdate

@OptIn(UnstableApi::class)
interface VideoPlayerListener {
  fun onStatusChanged(player: VideoPlayer, status: PlayerStatus, oldStatus: PlayerStatus?, error: PlaybackError?) {}
  fun onIsPlayingChanged(player: VideoPlayer, isPlaying: Boolean, oldIsPlaying: Boolean?) {}
  fun onVolumeChanged(player: VideoPlayer, newValue: VolumeEvent, oldVolume: VolumeEvent?) {}
  fun onSourceChanged(player: VideoPlayer, source: VideoSource?, oldSource: VideoSource?) {}
  fun onPlaybackRateChanged(player: VideoPlayer, rate: Float, oldRate: Float?) {}
  fun onTimeUpdate(player: VideoPlayer, timeUpdate: TimeUpdate) {}
  fun onPlayedToEnd(player: VideoPlayer) {}
}
