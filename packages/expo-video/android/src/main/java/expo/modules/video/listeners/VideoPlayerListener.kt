package expo.modules.video.listeners

import androidx.annotation.OptIn
import androidx.media3.common.TrackSelectionParameters
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import expo.modules.video.VideoView
import expo.modules.video.enums.AudioMixingMode
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.player.VideoPlayer
import expo.modules.video.records.AudioTrack
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.SubtitleTrack
import expo.modules.video.records.TimeUpdate
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VideoTrack

@OptIn(UnstableApi::class)
interface VideoPlayerListener {
  fun onStatusChanged(player: VideoPlayer, status: PlayerStatus, oldStatus: PlayerStatus?, error: PlaybackError?) {}
  fun onIsPlayingChanged(player: VideoPlayer, isPlaying: Boolean, oldIsPlaying: Boolean?) {}
  fun onVolumeChanged(player: VideoPlayer, volume: Float, oldVolume: Float?) {}
  fun onMutedChanged(player: VideoPlayer, muted: Boolean, oldMuted: Boolean?) {}
  fun onSourceChanged(player: VideoPlayer, source: VideoSource?, oldSource: VideoSource?) {}
  fun onPlaybackRateChanged(player: VideoPlayer, rate: Float, oldRate: Float?) {}
  fun onTracksChanged(player: VideoPlayer, tracks: Tracks) {}
  fun onTrackSelectionParametersChanged(player: VideoPlayer, trackSelectionParameters: TrackSelectionParameters) {}
  fun onTimeUpdate(player: VideoPlayer, timeUpdate: TimeUpdate) {}
  fun onPlayedToEnd(player: VideoPlayer) {}
  fun onAudioMixingModeChanged(player: VideoPlayer, audioMixingMode: AudioMixingMode, oldAudioMixingMode: AudioMixingMode?) {}
  fun onVideoTrackChanged(player: VideoPlayer, videoTrack: VideoTrack?, oldVideoTrack: VideoTrack?) {}
  fun onVideoSourceLoaded(player: VideoPlayer, videoSource: VideoSource?, duration: Double?, availableVideoTracks: List<VideoTrack>, availableSubtitleTracks: List<SubtitleTrack>, availableAudioTracks: List<AudioTrack>) {}
  fun onTargetViewChanged(player: VideoPlayer, newTargetView: VideoView?, oldTargetView: VideoView?) {}
  fun onRenderedFirstFrame(player: VideoPlayer) {}
}
