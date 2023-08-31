package expo.modules.video

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import expo.modules.kotlin.sharedobjects.SharedObject

class VideoPlayer(context: Context, val mediaItem: MediaItem): SharedObject() {
  val player = ExoPlayer.Builder(context).setLooper(context.mainLooper).build()
  fun preper() {
    player.setMediaItem(mediaItem)
    player.prepare()
  }
}