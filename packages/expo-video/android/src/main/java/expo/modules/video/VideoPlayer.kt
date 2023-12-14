package expo.modules.video

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.Closeable


@UnstableApi class VideoPlayer(context: Context, private val mediaItem: MediaItem) : Closeable, SharedObject() {
  val player = ExoPlayer.Builder(context).setLooper(context.mainLooper).build()
  val playerListener = PlayerListener()
  init {
    player.addListener(playerListener)
  }
  override fun close() {
    player.removeListener(playerListener)
  }
  fun prepare() {
    player.setMediaItem(mediaItem)
    player.prepare()
  }
}