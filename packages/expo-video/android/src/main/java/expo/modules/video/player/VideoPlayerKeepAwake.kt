package expo.modules.video.player

import androidx.annotation.OptIn
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.AppContext
import expo.modules.video.managers.VideoManager
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

/*
 * Keeps the screen on as long as the provided player is playing and some VideoView is visible.
 */
@OptIn(UnstableApi::class)
class VideoPlayerKeepAwake(player: VideoPlayer, val appContext: AppContext, enableOnInit: Boolean = true) : ReadWriteProperty<Any?, Boolean> {
  private val videoPlayer: WeakReference<VideoPlayer?> = WeakReference(player)
  var enabled = enableOnInit
    set(value) {
      if (value) {
        enable()
      } else {
        disable()
      }
      field = value
    }
  private var playerListener: Player.Listener? = null

  init {
    if (enableOnInit) {
      enable()
    }
  }

  private fun enable() {
    appContext.mainQueue.launch {
      val videoPlayer = this@VideoPlayerKeepAwake.videoPlayer.get() ?: return@launch
      val playerListener = createPlayerListener()
      this@VideoPlayerKeepAwake.playerListener = playerListener
      videoPlayer.player.addListener(playerListener)
      VideoManager.requestKeepAwake(videoPlayer)
    }
  }

  private fun disable() {
    appContext.mainQueue.launch {
      val videoPlayer = this@VideoPlayerKeepAwake.videoPlayer.get() ?: return@launch
      val playerListener = playerListener ?: return@launch
      videoPlayer.player.removeListener(playerListener)
      this@VideoPlayerKeepAwake.playerListener = null
      VideoManager.releaseKeepAwake(videoPlayer)
    }
  }

  private fun createPlayerListener(): Player.Listener {
    return object : Player.Listener {
      override fun onIsPlayingChanged(isPlaying: Boolean) {
        val videoPlayer = this@VideoPlayerKeepAwake.videoPlayer.get() ?: return
        if (isPlaying) {
          VideoManager.requestKeepAwake(videoPlayer)
        } else {
          VideoManager.releaseKeepAwake(videoPlayer)
        }
      }

      override fun onPlaybackStateChanged(playbackState: Int) {
        val videoPlayer = this@VideoPlayerKeepAwake.videoPlayer.get() ?: return

        when (playbackState) {
          Player.STATE_READY, Player.STATE_BUFFERING -> {
            if (videoPlayer.player.playWhenReady == true) { // Check if playback is intended
              VideoManager.requestKeepAwake(videoPlayer)
            }
          }
          Player.STATE_ENDED, Player.STATE_IDLE -> {
            VideoManager.requestKeepAwake(videoPlayer)
          }
        }
      }
    }
  }

  override fun getValue(thisRef: Any?, property: KProperty<*>): Boolean {
    return this.enabled
  }

  override fun setValue(thisRef: Any?, property: KProperty<*>, value: Boolean) {
    this.enabled = value
  }
}
