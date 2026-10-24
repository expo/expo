package expo.modules.audio.service

import android.os.Handler
import android.os.Looper
import androidx.core.net.toUri
import androidx.media3.common.AudioAttributes
import androidx.media3.common.DeviceInfo
import androidx.media3.common.FlagSet
import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.TrackSelectionParameters
import androidx.media3.common.Tracks
import androidx.media3.common.VideoSize
import androidx.media3.common.text.Cue
import androidx.media3.common.text.CueGroup
import androidx.media3.common.util.UnstableApi
import expo.modules.audio.Metadata
import java.util.IdentityHashMap

// MediaSession reads artwork from Player.mediaMetadata, but expo-audio lock-screen metadata can
// change independently of the underlying MediaItem. This wrapper lets the session observe those
// metadata updates without replacing the active media item on the real ExoPlayer instance.
@UnstableApi
internal class MetadataInjectingPlayer(
  player: Player
) : ForwardingPlayer(player) {
  private val handler = Handler(applicationLooper)
  private val listeners = IdentityHashMap<Player.Listener, Player.Listener>()
  private var injectedMetadata: Metadata? = null

  override fun addListener(listener: Player.Listener) {
    val forwardingListener = synchronized(listeners) {
      listeners.getOrPut(listener) { MetadataForwardingListener(listener) }
    }
    super.addListener(forwardingListener)
  }

  override fun removeListener(listener: Player.Listener) {
    val forwardingListener = synchronized(listeners) {
      listeners.remove(listener)
    }
    super.removeListener(forwardingListener ?: listener)
  }

  override fun getMediaMetadata(): MediaMetadata {
    val metadata = injectedMetadata
    return super.getMediaMetadata()
      .buildUpon()
      .setTitle(metadata?.title)
      .setArtist(metadata?.artist)
      .setAlbumTitle(metadata?.albumTitle)
      .setArtworkUri(metadata?.artworkUrl?.toString()?.toUri())
      .setArtworkData(null, null)
      .build()
  }

  fun updateMetadata(metadata: Metadata?) {
    if (Looper.myLooper() != applicationLooper) {
      handler.post { updateMetadata(metadata) }
      return
    }

    val previousMetadata = mediaMetadata
    injectedMetadata = metadata
    val newMetadata = mediaMetadata

    if (previousMetadata == newMetadata) {
      return
    }

    val events = Player.Events(
      FlagSet.Builder()
        .add(Player.EVENT_MEDIA_METADATA_CHANGED)
        .build()
    )
    val currentListeners = synchronized(listeners) {
      listeners.keys.toList()
    }

    currentListeners.forEach {
      it.onMediaMetadataChanged(newMetadata)
    }
    currentListeners.forEach {
      it.onEvents(this, events)
    }
  }

  // Every callback is forwarded by hand: Kotlin's `by` delegation skips the default methods of a
  // Java interface, and all of Player.Listener's are. Delegated, the session never heard of a
  // timeline change, a track change or an error, and its controller crashed the app ("Invalid
  // PlayerInfo update") once a playlist moved to an item added after the session was made.
  @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
  private inner class MetadataForwardingListener(
    private val listener: Player.Listener
  ) : Player.Listener {
    override fun onMediaMetadataChanged(mediaMetadata: MediaMetadata) {
      listener.onMediaMetadataChanged(this@MetadataInjectingPlayer.mediaMetadata)
    }

    override fun onEvents(player: Player, events: Player.Events) {
      listener.onEvents(this@MetadataInjectingPlayer, events)
    }

    override fun onTimelineChanged(timeline: Timeline, reason: Int) =
      listener.onTimelineChanged(timeline, reason)
    override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) =
      listener.onMediaItemTransition(mediaItem, reason)
    override fun onTracksChanged(tracks: Tracks) = listener.onTracksChanged(tracks)
    override fun onPlaylistMetadataChanged(mediaMetadata: MediaMetadata) =
      listener.onPlaylistMetadataChanged(mediaMetadata)
    override fun onIsLoadingChanged(isLoading: Boolean) = listener.onIsLoadingChanged(isLoading)
    override fun onLoadingChanged(isLoading: Boolean) = listener.onLoadingChanged(isLoading)
    override fun onAvailableCommandsChanged(availableCommands: Player.Commands) =
      listener.onAvailableCommandsChanged(availableCommands)
    override fun onTrackSelectionParametersChanged(parameters: TrackSelectionParameters) =
      listener.onTrackSelectionParametersChanged(parameters)
    override fun onPlayerStateChanged(playWhenReady: Boolean, playbackState: Int) =
      listener.onPlayerStateChanged(playWhenReady, playbackState)
    override fun onPlaybackStateChanged(playbackState: Int) = listener.onPlaybackStateChanged(playbackState)
    override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) =
      listener.onPlayWhenReadyChanged(playWhenReady, reason)
    override fun onPlaybackSuppressionReasonChanged(playbackSuppressionReason: Int) =
      listener.onPlaybackSuppressionReasonChanged(playbackSuppressionReason)
    override fun onIsPlayingChanged(isPlaying: Boolean) = listener.onIsPlayingChanged(isPlaying)
    override fun onRepeatModeChanged(repeatMode: Int) = listener.onRepeatModeChanged(repeatMode)
    override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) =
      listener.onShuffleModeEnabledChanged(shuffleModeEnabled)
    override fun onPlayerError(error: PlaybackException) = listener.onPlayerError(error)
    override fun onPlayerErrorChanged(error: PlaybackException?) = listener.onPlayerErrorChanged(error)
    override fun onPositionDiscontinuity(reason: Int) = listener.onPositionDiscontinuity(reason)
    override fun onPositionDiscontinuity(
      oldPosition: Player.PositionInfo,
      newPosition: Player.PositionInfo,
      reason: Int
    ) = listener.onPositionDiscontinuity(oldPosition, newPosition, reason)
    override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) =
      listener.onPlaybackParametersChanged(playbackParameters)
    override fun onSeekBackIncrementChanged(seekBackIncrementMs: Long) =
      listener.onSeekBackIncrementChanged(seekBackIncrementMs)
    override fun onSeekForwardIncrementChanged(seekForwardIncrementMs: Long) =
      listener.onSeekForwardIncrementChanged(seekForwardIncrementMs)
    override fun onMaxSeekToPreviousPositionChanged(maxSeekToPreviousPositionMs: Long) =
      listener.onMaxSeekToPreviousPositionChanged(maxSeekToPreviousPositionMs)
    override fun onAudioSessionIdChanged(audioSessionId: Int) =
      listener.onAudioSessionIdChanged(audioSessionId)
    override fun onAudioAttributesChanged(audioAttributes: AudioAttributes) =
      listener.onAudioAttributesChanged(audioAttributes)
    override fun onVolumeChanged(volume: Float) = listener.onVolumeChanged(volume)
    override fun onSkipSilenceEnabledChanged(skipSilenceEnabled: Boolean) =
      listener.onSkipSilenceEnabledChanged(skipSilenceEnabled)
    override fun onDeviceInfoChanged(deviceInfo: DeviceInfo) = listener.onDeviceInfoChanged(deviceInfo)
    override fun onDeviceVolumeChanged(volume: Int, muted: Boolean) =
      listener.onDeviceVolumeChanged(volume, muted)
    override fun onVideoSizeChanged(videoSize: VideoSize) = listener.onVideoSizeChanged(videoSize)
    override fun onSurfaceSizeChanged(width: Int, height: Int) = listener.onSurfaceSizeChanged(width, height)
    override fun onRenderedFirstFrame() = listener.onRenderedFirstFrame()
    override fun onCues(cues: List<Cue>) = listener.onCues(cues)
    override fun onCues(cueGroup: CueGroup) = listener.onCues(cueGroup)
    override fun onMetadata(metadata: androidx.media3.common.Metadata) = listener.onMetadata(metadata)
  }
}
