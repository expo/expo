package expo.modules.audio

import androidx.media3.common.C
import androidx.media3.common.Player
import expo.modules.kotlin.AppContext
import kotlinx.coroutines.launch

/**
 * Common interface for audio playback objects (AudioPlayer, AudioPlaylist).
 * Provides default implementations for operations shared between player types.
 */
interface Playable {
  val id: String
  var isPaused: Boolean
  var isMuted: Boolean
  var previousVolume: Float
  var onPlaybackStateChange: ((Boolean) -> Unit)?

  val player: Player
  val appContext: AppContext?

  val currentTime: Double get() = player.currentPosition / 1000.0
  val duration: Double get() = if (player.duration != C.TIME_UNSET) player.duration / 1000.0 else 0.0
  val isPlaying: Boolean get() = player.isPlaying
  val volume: Float get() = player.volume

  fun play() {
    player.play()
  }

  fun pause() {
    player.pause()
  }

  fun seekTo(seconds: Double) {
    player.seekTo((seconds * 1000L).toLong())
  }

  fun setVolume(volume: Float?) {
    appContext?.mainQueue?.launch {
      val boundedVolume = volume?.coerceIn(0f, 1f) ?: 1f
      if (isMuted) {
        if (boundedVolume > 0f) {
          previousVolume = boundedVolume
        }
        player.volume = 0f
      } else {
        previousVolume = boundedVolume
        player.volume = boundedVolume
      }
    }
  }

  fun setPlaybackRate(rate: Float)
  fun currentStatus(): Map<String, Any?>
}
