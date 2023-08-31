package expo.modules.video

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import expo.modules.kotlin.sharedobjects.SharedObject

class VideoPlayerRef(context: Context, mediaItem: MediaItem): SharedObject() {
  val player = ExoPlayer.Builder(context).build()
  init {
    player.setMediaItem(mediaItem)
    player.prepare()
  }
}