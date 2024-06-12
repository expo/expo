package expo.modules.audio

import android.content.Context
import androidx.media3.common.AudioAttributes
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.MediaSource
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedRef
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID

@UnstableApi
class AudioPlayer(
  context: Context,
  appContext: AppContext,
  source: MediaSource
) : SharedRef<ExoPlayer>(
  ExoPlayer.Builder(context)
    .setLooper(context.mainLooper)
    .build()
    .apply {
      setMediaSource(source)
      setAudioAttributes(AudioAttributes.DEFAULT, true)
      prepare()
    },
  appContext
) {
  val id = UUID.randomUUID().toString()
  val player = ref
  var preservesPitch = false
  var isPaused = false

  private var playerScope = CoroutineScope(Dispatchers.Default)

  init {
    addPlayerListeners()
    player.setAudioAttributes(AudioAttributes.DEFAULT, true)
    playerScope.launch {
      while (isActive) {
        sendPlayerUpdate()
        delay(500)
      }
    }
  }

  private fun addPlayerListeners() {
    player.addListener(object : Player.Listener {
      override fun onIsPlayingChanged(isPlaying: Boolean) {
        playerScope.launch {
          sendPlayerUpdate(mapOf("playing" to isPlaying))
        }
      }

      override fun onIsLoadingChanged(isLoading: Boolean) {
        playerScope.launch {
          sendPlayerUpdate(mapOf("isLoaded" to isLoading))
        }
      }

      override fun onPlaybackStateChanged(playbackState: Int) {
        playerScope.launch {
          sendPlayerUpdate(mapOf("status" to playbackStateToString(playbackState)))
        }
      }
    })
  }

  private suspend fun sendPlayerUpdate(map: Map<String, Any?>? = null) = withContext(Dispatchers.Main) {
    val isMuted = player.volume == 0f
    val isLooping = player.repeatMode == Player.REPEAT_MODE_ONE
    val isLoaded = player.playbackState == Player.STATE_READY
    val isBuffering = player.playbackState == Player.STATE_BUFFERING

    val data = mapOf(
      "id" to id,
      "currentTime" to player.currentPosition,
      "status" to playbackStateToString(player.playbackState),
      "timeControlStatus" to if (player.isPlaying) "playing" else "paused",
      "reasonForWaitingToPlay" to null,
      "mute" to isMuted,
      "duration" to player.duration,
      "playing" to player.isPlaying,
      "loop" to isLooping,
      "isLoaded" to if (player.playbackState == Player.STATE_ENDED) true else isLoaded,
      "playbackRate" to player.playbackParameters.speed,
      "shouldCorrectPitch" to preservesPitch,
      "isBuffering" to isBuffering
    )

    val body = map?.let { data + it } ?: data
    sendEventOnJSThread(body)
  }

  private fun playbackStateToString(state: Int): String {
    return when (state) {
      Player.STATE_READY -> "ready"
      Player.STATE_BUFFERING -> "buffering"
      Player.STATE_IDLE -> "idle"
      Player.STATE_ENDED -> "ended"
      else -> "unknown"
    }
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
