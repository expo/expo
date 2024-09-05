package expo.modules.video

import android.os.Handler
import android.os.Looper
import androidx.media3.common.util.UnstableApi
import kotlin.math.floor

@androidx.annotation.OptIn(UnstableApi::class)
class ProgressTracker (private val videoPlayer: VideoPlayer) : Runnable {
  private val handler: Handler = Handler(Looper.getMainLooper())
  private val player = videoPlayer.player

  init {
    handler.post(this)
  }

  override fun run() {
    val currentPosition = player.currentPosition
    val duration = player.duration
    val timeRemaining = floor(((duration - currentPosition) / 1000).toDouble())
    videoPlayer.sendEvent(PlayerEvent.PlayerTimeRemainingChanged(timeRemaining))
    handler.postDelayed(this, 1000)
  }

  fun remove() {
    handler.removeCallbacks(this)
  }
}