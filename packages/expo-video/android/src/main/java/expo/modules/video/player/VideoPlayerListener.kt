package expo.modules.video.player

import androidx.annotation.OptIn
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.VideoSource
import expo.modules.video.records.TimeUpdate

@OptIn(UnstableApi::class)
interface VideoPlayerListener {
  fun onStatusChanged(player: VideoPlayer, status: PlayerStatus, oldStatus: PlayerStatus?, error: PlaybackError?) {}
  fun onIsPlayingChanged(player: VideoPlayer, isPlaying: Boolean, oldIsPlaying: Boolean?) {}
  fun onVolumeChanged(player: VideoPlayer, volume: Float, oldVolume: Float?) {}
  fun onMutedChanged(player: VideoPlayer, muted: Boolean, oldMuted: Boolean?) {}
  fun onSourceChanged(player: VideoPlayer, source: VideoSource?, oldSource: VideoSource?) {}
  fun onPlaybackRateChanged(player: VideoPlayer, rate: Float, oldRate: Float?) {}
  fun onTracksChanged(player: VideoPlayer, tracks: Tracks) {}
  fun onTimeUpdate(player: VideoPlayer, timeUpdate: TimeUpdate) {}
  fun onPlayedToEnd(player: VideoPlayer) {}
}
