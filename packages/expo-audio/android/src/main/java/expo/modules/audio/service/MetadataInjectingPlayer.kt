package expo.modules.audio.service

import android.os.Handler
import android.os.Looper
import androidx.core.net.toUri
import androidx.media3.common.FlagSet
import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
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

  private inner class MetadataForwardingListener(
    private val listener: Player.Listener
  ) : Player.Listener by listener {
    override fun onMediaMetadataChanged(mediaMetadata: MediaMetadata) {
      listener.onMediaMetadataChanged(this@MetadataInjectingPlayer.mediaMetadata)
    }

    override fun onEvents(player: Player, events: Player.Events) {
      listener.onEvents(this@MetadataInjectingPlayer, events)
    }
  }
}
