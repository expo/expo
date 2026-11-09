package expo.modules.mediasession.service

import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.DeviceInfo
import androidx.media3.common.FlagSet
import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Metadata
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
import expo.modules.mediasession.NowPlayingCenterState
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind
import java.util.IdentityHashMap

/** Confined to the wrapped player's application looper. Transport calls go to the owner, never to its player. */
@OptIn(UnstableApi::class)
internal class OwnerForwardingPlayer(
  player: Player,
  private val onPlayRequested: () -> Unit,
  private val onCommand: (RemoteCommand) -> Unit
) : ForwardingPlayer(player), SessionPlayer {
  private val listeners = IdentityHashMap<Player.Listener, MetadataForwardingListener>()
  private var state: NowPlayingCenterState? = null

  private val kinds: Set<RemoteCommandKind>
    get() = state?.commands ?: emptySet()

  override val isPlaybackOngoing: Boolean
    get() = wrappedPlayer.playWhenReady &&
      (wrappedPlayer.playbackState == Player.STATE_READY || wrappedPlayer.playbackState == Player.STATE_BUFFERING)

  override fun apply(state: NowPlayingCenterState) {
    val previous = this.state
    val previousMetadata = mediaMetadata
    this.state = state
    val targets = listeners.values.toList()
    if (targets.isEmpty()) {
      return
    }
    val events = mutableListOf<Int>()
    val metadata = mediaMetadata
    if (metadata != previousMetadata) {
      events.add(Player.EVENT_MEDIA_METADATA_CHANGED)
      targets.forEach { it.listener.onMediaMetadataChanged(metadata) }
    }
    if (previous?.commands != state.commands) {
      events.add(Player.EVENT_AVAILABLE_COMMANDS_CHANGED)
      val commands = availableCommands
      targets.forEach { it.listener.onAvailableCommandsChanged(commands) }
    }
    if (previous?.info?.skipForwardInterval != state.info.skipForwardInterval) {
      events.add(Player.EVENT_SEEK_FORWARD_INCREMENT_CHANGED)
      targets.forEach { it.listener.onSeekForwardIncrementChanged(seekForwardIncrement) }
    }
    if (previous?.info?.skipBackwardInterval != state.info.skipBackwardInterval) {
      events.add(Player.EVENT_SEEK_BACK_INCREMENT_CHANGED)
      targets.forEach { it.listener.onSeekBackIncrementChanged(seekBackIncrement) }
    }
    if (events.isNotEmpty()) {
      val changed = Player.Events(FlagSet.Builder().addAll(*events.toIntArray()).build())
      targets.forEach { it.listener.onEvents(this, changed) }
    }
  }

  override fun detach() {
    listeners.clear()
  }

  override fun addListener(listener: Player.Listener) {
    val forwarding = listeners.getOrPut(listener) { MetadataForwardingListener(listener, this) { mediaMetadata } }
    super.addListener(forwarding)
  }

  override fun removeListener(listener: Player.Listener) {
    super.removeListener(listeners.remove(listener) ?: listener)
  }

  override fun getMediaMetadata(): MediaMetadata {
    val info = state?.info ?: return super.getMediaMetadata()
    return super.getMediaMetadata()
      .buildUpon()
      .setTitle(info.title)
      .setArtist(info.artist)
      .setAlbumTitle(info.album)
      .setArtworkUri(info.artworkUrl?.let(Uri::parse))
      .setArtworkData(null, null)
      .build()
  }

  override fun getAvailableCommands(): Player.Commands = playerCommands(kinds)

  override fun isCommandAvailable(command: Int) = command in playerCommandSet(kinds)

  override fun getSeekForwardIncrement() = skipIntervalMs(state?.info?.skipForwardInterval)

  override fun getSeekBackIncrement() = skipIntervalMs(state?.info?.skipBackwardInterval)

  override fun play() = setPlayWhenReady(true)

  override fun pause() = setPlayWhenReady(false)

  override fun setPlayWhenReady(playWhenReady: Boolean) {
    if (playWhenReady) {
      onPlayRequested()
    }
    playWhenReadyCommand(playWhenReady, kinds, wrappedPlayer.playWhenReady)?.let(onCommand)
  }

  override fun seekTo(positionMs: Long) = seek(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM, positionMs)

  override fun seekTo(mediaItemIndex: Int, positionMs: Long) {
    if (mediaItemIndex == currentMediaItemIndex) {
      seek(Player.COMMAND_SEEK_IN_CURRENT_MEDIA_ITEM, positionMs)
    }
  }

  override fun seekToDefaultPosition() = Unit

  override fun seekToDefaultPosition(mediaItemIndex: Int) = Unit

  override fun seekForward() = seek(Player.COMMAND_SEEK_FORWARD)

  override fun seekBack() = seek(Player.COMMAND_SEEK_BACK)

  override fun seekToNext() = seek(Player.COMMAND_SEEK_TO_NEXT)

  override fun seekToNextMediaItem() = seek(Player.COMMAND_SEEK_TO_NEXT_MEDIA_ITEM)

  override fun seekToPrevious() = seek(Player.COMMAND_SEEK_TO_PREVIOUS)

  override fun seekToPreviousMediaItem() = seek(Player.COMMAND_SEEK_TO_PREVIOUS_MEDIA_ITEM)

  override fun stop() = Unit

  override fun release() = Unit

  private fun seek(command: Int, positionMs: Long = 0) {
    val info = state?.info ?: return
    seekCommand(command, positionMs, info)?.let(onCommand)
  }
}

@OptIn(UnstableApi::class)
internal class MetadataForwardingListener(
  val listener: Player.Listener,
  private val player: Player,
  private val metadata: () -> MediaMetadata
) : Player.Listener {
  override fun onEvents(player: Player, events: Player.Events) = listener.onEvents(this.player, events)

  override fun onTimelineChanged(timeline: Timeline, reason: Int) = listener.onTimelineChanged(timeline, reason)

  override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) = listener.onMediaItemTransition(mediaItem, reason)

  override fun onTracksChanged(tracks: Tracks) = listener.onTracksChanged(tracks)

  override fun onMediaMetadataChanged(mediaMetadata: MediaMetadata) = listener.onMediaMetadataChanged(metadata())

  override fun onPlaylistMetadataChanged(mediaMetadata: MediaMetadata) = listener.onPlaylistMetadataChanged(mediaMetadata)

  override fun onIsLoadingChanged(isLoading: Boolean) = listener.onIsLoadingChanged(isLoading)

  @Deprecated("Deprecated in Media3")
  @Suppress("DEPRECATION")
  override fun onLoadingChanged(isLoading: Boolean) = listener.onLoadingChanged(isLoading)

  override fun onAvailableCommandsChanged(availableCommands: Player.Commands) =
    listener.onAvailableCommandsChanged(player.availableCommands)

  override fun onTrackSelectionParametersChanged(parameters: TrackSelectionParameters) =
    listener.onTrackSelectionParametersChanged(parameters)

  @Deprecated("Deprecated in Media3")
  @Suppress("DEPRECATION")
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

  @Deprecated("Deprecated in Media3")
  @Suppress("DEPRECATION")
  override fun onPositionDiscontinuity(reason: Int) = listener.onPositionDiscontinuity(reason)

  override fun onPositionDiscontinuity(oldPosition: Player.PositionInfo, newPosition: Player.PositionInfo, reason: Int) =
    listener.onPositionDiscontinuity(oldPosition, newPosition, reason)

  override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) =
    listener.onPlaybackParametersChanged(playbackParameters)

  override fun onSeekBackIncrementChanged(seekBackIncrementMs: Long) =
    listener.onSeekBackIncrementChanged(player.seekBackIncrement)

  override fun onSeekForwardIncrementChanged(seekForwardIncrementMs: Long) =
    listener.onSeekForwardIncrementChanged(player.seekForwardIncrement)

  override fun onMaxSeekToPreviousPositionChanged(maxSeekToPreviousPositionMs: Long) =
    listener.onMaxSeekToPreviousPositionChanged(maxSeekToPreviousPositionMs)

  override fun onAudioSessionIdChanged(audioSessionId: Int) = listener.onAudioSessionIdChanged(audioSessionId)

  override fun onAudioAttributesChanged(audioAttributes: AudioAttributes) =
    listener.onAudioAttributesChanged(audioAttributes)

  override fun onVolumeChanged(volume: Float) = listener.onVolumeChanged(volume)

  override fun onSkipSilenceEnabledChanged(skipSilenceEnabled: Boolean) =
    listener.onSkipSilenceEnabledChanged(skipSilenceEnabled)

  override fun onDeviceInfoChanged(deviceInfo: DeviceInfo) = listener.onDeviceInfoChanged(deviceInfo)

  override fun onDeviceVolumeChanged(volume: Int, muted: Boolean) = listener.onDeviceVolumeChanged(volume, muted)

  override fun onVideoSizeChanged(videoSize: VideoSize) = listener.onVideoSizeChanged(videoSize)

  override fun onSurfaceSizeChanged(width: Int, height: Int) = listener.onSurfaceSizeChanged(width, height)

  override fun onRenderedFirstFrame() = listener.onRenderedFirstFrame()

  @Deprecated("Deprecated in Media3")
  @Suppress("DEPRECATION")
  override fun onCues(cues: List<Cue>) = listener.onCues(cues)

  override fun onCues(cueGroup: CueGroup) = listener.onCues(cueGroup)

  override fun onMetadata(metadata: Metadata) = listener.onMetadata(metadata)
}
