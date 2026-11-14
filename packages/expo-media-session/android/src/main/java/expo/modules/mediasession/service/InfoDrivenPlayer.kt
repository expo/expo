package expo.modules.mediasession.service

import android.net.Uri
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.SimpleBasePlayer
import androidx.media3.common.util.UnstableApi
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import expo.modules.mediasession.NowPlayingCenterState
import expo.modules.mediasession.NowPlayingMediaType
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind

/** Confined to [looper]. */
@OptIn(UnstableApi::class)
internal class InfoDrivenPlayer(
  looper: Looper,
  private val onPlayRequested: () -> Unit,
  private val onCommand: (RemoteCommand) -> Unit
) : SimpleBasePlayer(looper), SessionPlayer {
  private var current: NowPlayingCenterState? = null
  private var snapshot = State.Builder().build()

  override val isPlaybackOngoing: Boolean
    get() = current?.isPlaying == true

  override fun apply(state: NowPlayingCenterState) {
    current = state
    snapshot = stateFor(state)
    invalidateState()
  }

  override fun detach() {
    current = null
    release()
  }

  override fun getState(): State = snapshot

  override fun handleSetPlayWhenReady(playWhenReady: Boolean): ListenableFuture<*> {
    if (playWhenReady) {
      onPlayRequested()
    }
    current?.let { playWhenReadyCommand(playWhenReady, it.commands, it.isPlaying) }?.let(onCommand)
    return Futures.immediateVoidFuture()
  }

  override fun handleSeek(mediaItemIndex: Int, positionMs: Long, seekCommand: Int): ListenableFuture<*> {
    current?.let { seekCommand(seekCommand, positionMs, it.info) }?.let(onCommand)
    return Futures.immediateVoidFuture()
  }

  override fun handleRelease(): ListenableFuture<*> = Futures.immediateVoidFuture()

  private fun stateFor(state: NowPlayingCenterState): State {
    val info = state.info
    val shape = playlistShape(state.commands)
    val metadata = MediaMetadata.Builder()
      .setTitle(info.title)
      .setArtist(info.artist)
      .setAlbumTitle(info.album)
      .setArtworkUri(info.artworkUrl?.let(Uri::parse))
      .setMediaType(
        if (state.mediaType == NowPlayingMediaType.VIDEO) {
          MediaMetadata.MEDIA_TYPE_VIDEO
        } else {
          MediaMetadata.MEDIA_TYPE_MUSIC
        }
      )
      .build()
    val durationUs = info.duration?.takeIf { !info.isLiveStream && it.isFinite() && it >= 0 }
      ?.let { (it * C.MICROS_PER_SECOND).toLong() } ?: C.TIME_UNSET
    val playlist = (0 until shape.count).map { index ->
      val item = MediaItemData.Builder(index).setMediaItem(MediaItem.Builder().setMediaId("$MEDIA_ID_PREFIX$index").build())
      if (index == shape.currentIndex) {
        item.setMediaMetadata(metadata)
          .setDurationUs(durationUs)
          .setIsSeekable(RemoteCommandKind.SEEK in state.commands)
          .setIsDynamic(info.isLiveStream)
      }
      item.build()
    }
    val rate = info.playbackRate?.toFloat()?.takeIf { it.isFinite() && it > 0 } ?: 1f
    val positionMs = ((info.elapsedTime ?: 0.0).coerceAtLeast(0.0) * 1000).toLong()
    val position = if (state.isPlaying && !info.isLiveStream) {
      PositionSupplier.getExtrapolating(positionMs, rate)
    } else {
      PositionSupplier.getConstant(positionMs)
    }
    return State.Builder()
      .setAvailableCommands(playerCommands(state.commands))
      .setPlaylist(playlist)
      .setCurrentMediaItemIndex(shape.currentIndex)
      .setPlaybackState(Player.STATE_READY)
      .setPlayWhenReady(state.isPlaying, Player.PLAY_WHEN_READY_CHANGE_REASON_REMOTE)
      .setContentPositionMs(position)
      .setPlaybackParameters(PlaybackParameters(rate))
      .setSeekForwardIncrementMs(skipIntervalMs(info.skipForwardInterval))
      .setSeekBackIncrementMs(skipIntervalMs(info.skipBackwardInterval))
      .build()
  }

  private companion object {
    const val MEDIA_ID_PREFIX = "expo-media-session-"
  }
}
