package expo.modules.audio

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.SeekParameters
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.sharedobjects.SharedRef
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.time.Duration.Companion.seconds

@UnstableApi
class AudioPlayer(
  context: Context,
  appContext: AppContext,
  mediaItem: MediaItem
) : SharedRef<ExoPlayer>(ExoPlayer.Builder(context)
  .setLooper(context.mainLooper)
  .build().apply {
    addMediaItem(mediaItem)
    prepare()
  }, appContext) {
  var preservesPitch = false
  val player = ref

  private var playerScope = CoroutineScope(Dispatchers.Default)

  init {
    playerScope.launch {
      while (isActive) {
        sendPlayerUpdate()
        delay(1000)
      }
    }
  }

  private suspend fun sendPlayerUpdate() = withContext(Dispatchers.Main) {
    val isMuted = player.volume == 0f
    val isLooping = player.repeatMode == Player.REPEAT_MODE_ONE
    val ready = player.playbackState == Player.STATE_READY
    val isBuffering = player.playbackState == Player.STATE_BUFFERING

    sendEventOnJSThread(mapOf(
      "id" to sharedObjectId.value,
      "currentTime" to player.currentPosition,
      "status" to player.playbackState,
      "timeControlStatus" to if (player.isPlaying) "playing" else "paused",
      "reasonForWaitingToPlay" to "",
      "muted" to isMuted,
      "duration" to player.duration,
      "isPlaying" to player.isPlaying,
      "loop" to isLooping,
      "isLoaded" to ready,
      "playbackRate" to player.playbackParameters.speed,
      "shouldCorrectPitch" to preservesPitch,
      "isBuffering" to isBuffering
    ))
  }

  private fun sendEventOnJSThread(vararg args: Any?) {
    appContext?.executeOnJavaScriptThread {
      sendEvent("onPlaybackStatusUpdate", *args)
    }
  }

  override fun deallocate() {
    appContext?.mainQueue?.launch {
      playerScope.cancel()
      player.release()
    }
  }
}