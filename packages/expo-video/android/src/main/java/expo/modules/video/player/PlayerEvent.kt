package expo.modules.video.player

import androidx.annotation.OptIn
import androidx.media3.common.TrackSelectionParameters
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import expo.modules.video.VideoView
import expo.modules.video.enums.AudioMixingMode
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.listeners.VideoPlayerListener
import expo.modules.video.records.AudioTrack
import expo.modules.video.records.AvailableSubtitleTracksChangedEventPayload
import expo.modules.video.records.AvailableAudioTracksChangedEventPayload
import expo.modules.video.records.IsPlayingEventPayload
import expo.modules.video.records.MutedChangedEventPayload
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.PlaybackRateChangedEventPayload
import expo.modules.video.records.SourceChangedEventPayload
import expo.modules.video.records.StatusChangedEventPayload
import expo.modules.video.records.SubtitleTrack
import expo.modules.video.records.SubtitleTrackChangedEventPayload
import expo.modules.video.records.AudioTrackChangedEventPayload
import expo.modules.video.records.TimeUpdate
import expo.modules.video.records.VideoEventPayload
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VideoSourceLoadedEventPayload
import expo.modules.video.records.VideoTrack
import expo.modules.video.records.VideoTrackChangedEventPayload
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

  data class TrackSelectionParametersChanged(val trackSelectionParameters: TrackSelectionParameters) : PlayerEvent() {
    override val name = "trackSelectionParametersChange"
    override val emitToJS = false
  }

  data class SubtitleTrackChanged(val subtitleTrack: SubtitleTrack?, val oldSubtitleTrack: SubtitleTrack?) : PlayerEvent() {
    override val name = "subtitleTrackChange"
    override val jsEventPayload = SubtitleTrackChangedEventPayload(subtitleTrack, oldSubtitleTrack)
  }

  data class AudioTrackChanged(val audioTrack: AudioTrack?, val oldAudioTrack: AudioTrack?) : PlayerEvent() {
    override val name = "audioTrackChange"
    override val jsEventPayload = AudioTrackChangedEventPayload(audioTrack, oldAudioTrack)
  }

  data class VideoTrackChanged(val videoTrack: VideoTrack?, val oldVideoTrack: VideoTrack?) : PlayerEvent() {
    override val name = "videoTrackChange"
    override val jsEventPayload = VideoTrackChangedEventPayload(videoTrack, oldVideoTrack)
  }

  class RenderedFirstFrame : PlayerEvent() {
    override val name = "renderFirstFrame"

    // This Event is emitted through the view (we are matching the AVKit API behavior)
    override val emitToJS = false
  }

  data class AvailableSubtitleTracksChanged(
    val availableSubtitleTracks: List<SubtitleTrack>,
    val oldAvailableSubtitleTracks: List<SubtitleTrack>
  ) : PlayerEvent() {
    override val name = "availableSubtitleTracksChange"
    override val jsEventPayload = AvailableSubtitleTracksChangedEventPayload(availableSubtitleTracks, oldAvailableSubtitleTracks)
  }

  data class AvailableAudioTracksChanged(
    val availableAudioTracks: List<AudioTrack>,
    val oldAvailableAudioTracks: List<AudioTrack>
  ) : PlayerEvent() {
    override val name = "availableAudioTracksChange"
    override val jsEventPayload = AvailableAudioTracksChangedEventPayload(availableAudioTracks, oldAvailableAudioTracks)
  }

  data class VideoSourceLoaded(
    val videoSource: VideoSource?,
    val duration: Double,
    val availableVideoTracks: List<VideoTrack>,
    val availableSubtitleTracks: List<SubtitleTrack>,
    val availableAudioTracks: List<AudioTrack>
  ) : PlayerEvent() {
    override val name = "sourceLoad"
    override val jsEventPayload = VideoSourceLoadedEventPayload(
      videoSource,
      duration,
      availableVideoTracks,
      availableSubtitleTracks,
      availableAudioTracks
    )
  }

  data class TimeUpdated(val timeUpdate: TimeUpdate) : PlayerEvent() {
    override val name = "timeUpdate"
    override val jsEventPayload = timeUpdate
  }

  data class AudioMixingModeChanged(val audioMixingMode: AudioMixingMode, val oldAudioMixingMode: AudioMixingMode?) : PlayerEvent() {
    override val name = "audioMixingModeChange"
    override val emitToJS = false
  }

  class PlayedToEnd : PlayerEvent() {
    override val name = "playToEnd"
  }

  data class TargetViewChanged(val newTargetView: VideoView?, val oldTargetView: VideoView?) : PlayerEvent() {
    override val name = "targetViewChange"
    override val emitToJS = false
  }

  fun emit(player: VideoPlayer, listeners: List<VideoPlayerListener>) {
    when (this) {
      is StatusChanged -> listeners.forEach { it.onStatusChanged(player, status, oldStatus, error) }
      is IsPlayingChanged -> listeners.forEach { it.onIsPlayingChanged(player, isPlaying, oldIsPlaying) }
      is VolumeChanged -> listeners.forEach { it.onVolumeChanged(player, volume, oldVolume) }
      is SourceChanged -> listeners.forEach { it.onSourceChanged(player, source, oldSource) }
      is PlaybackRateChanged -> listeners.forEach { it.onPlaybackRateChanged(player, rate, oldRate) }
      is TracksChanged -> listeners.forEach { it.onTracksChanged(player, tracks) }
      is TrackSelectionParametersChanged -> listeners.forEach { it.onTrackSelectionParametersChanged(player, trackSelectionParameters) }
      is TimeUpdated -> listeners.forEach { it.onTimeUpdate(player, timeUpdate) }
      is PlayedToEnd -> listeners.forEach { it.onPlayedToEnd(player) }
      is MutedChanged -> listeners.forEach { it.onMutedChanged(player, muted, oldMuted) }
      is AudioMixingModeChanged -> listeners.forEach { it.onAudioMixingModeChanged(player, audioMixingMode, oldAudioMixingMode) }
      is VideoTrackChanged -> listeners.forEach { it.onVideoTrackChanged(player, videoTrack, oldVideoTrack) }
      is RenderedFirstFrame -> listeners.forEach { it.onRenderedFirstFrame(player) }
      is VideoSourceLoaded -> listeners.forEach { it.onVideoSourceLoaded(player, videoSource, duration, availableVideoTracks, availableSubtitleTracks, availableAudioTracks) }
      is TargetViewChanged -> listeners.forEach { it.onTargetViewChanged(player, newTargetView, oldTargetView) }
      // JS-only events - SubtitleTrackChanged - In the native events the TracksChanged can be used instead
      else -> Unit
    }
  }
}
