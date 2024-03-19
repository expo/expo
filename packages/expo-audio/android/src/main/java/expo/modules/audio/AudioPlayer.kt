package expo.modules.audio

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.time.Duration.Companion.seconds

@UnstableApi
class AudioPlayer(
  context: Context,
  appContext: AppContext,
  mediaItem: MediaItem
) : SharedObject(appContext) {
  val player = ExoPlayer.Builder(context)
    .setLooper(context.mainLooper)
    .build()
  var preservesPitch = false

  private var playerScope = CoroutineScope(Dispatchers.Main)
  override fun deallocate() {
    appContext?.mainQueue?.launch {
      playerScope.cancel()
      player.release()
    }
  }

  init {
    playerScope.launch {
      player.addMediaItem(mediaItem)
      player.prepare()
      while (isActive) {
        sendPlayerUpdate()
        delay(1000)
      }
    }
  }

  private fun sendPlayerUpdate() {
    val isMuted = player.volume == 0f
    val isLooping = player.repeatMode == Player.REPEAT_MODE_ONE
    val ready = player.playbackState == Player.STATE_READY
    val isBuffering = player.playbackState == Player.STATE_BUFFERING

    sendEvent("onPlaybackStatusUpdate", mapOf(
      "id" to 0,
      "currentPosition" to player.currentPosition.seconds * 1000,
      "status" to "unknown",
      "timeControlStatus" to if (player.isPlaying) "playing" else "paused",
      "reasonForWaitingToPlay" to "",
      "isMuted" to isMuted,
      "totalDuration" to player.duration.seconds * 1000,
      "isPlaying" to player.isPlaying,
      "isLooping" to isLooping,
      "isLoaded" to ready,
      "rate" to player.playbackParameters.speed,
      "shouldCorrectPitch" to preservesPitch,
      "isBuffering" to isBuffering
    ))
  }
}