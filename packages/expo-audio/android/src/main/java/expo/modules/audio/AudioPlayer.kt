package expo.modules.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.audiofx.Visualizer
import android.util.Log
import androidx.core.content.ContextCompat
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

private const val PLAYBACK_STATUS_UPDATE = "playbackStatusUpdate"
private const val AUDIO_SAMPLE_UPDATE = "audioSampleUpdate"

@UnstableApi
class AudioPlayer(
  context: Context,
  appContext: AppContext,
  source: MediaSource,
  updateInterval: Double
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
  private var samplingEnabled = false
  private var visualizer: Visualizer? = null

  init {
    addPlayerListeners()
    player.setAudioAttributes(AudioAttributes.DEFAULT, true)
    playerScope.launch {
      while (isActive) {
        sendPlayerUpdate()
        delay(updateInterval.toLong())
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

  fun setSamplingEnabled(enabled: Boolean) {
    samplingEnabled = enabled
    if (enabled) {
      createVisualizer()
    } else {
      visualizer?.release()
      visualizer = null
    }
  }

  private fun extractAmplitudes(chunk: ByteArray): List<Float> = chunk.map { byte ->
    val unsignedByte = byte.toInt() and 0xFF
    ((unsignedByte - 128).toDouble() / 128.0).toFloat()
  }

  fun currentStatus(): Map<String, Any?> {
    val isMuted = player.volume == 0f
    val isLooping = player.repeatMode == Player.REPEAT_MODE_ONE
    val isLoaded = player.playbackState == Player.STATE_READY
    val isBuffering = player.playbackState == Player.STATE_BUFFERING

    return mapOf(
      "id" to id,
      "currentTime" to player.currentPosition,
      "playbackState" to playbackStateToString(player.playbackState),
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
  }

  private suspend fun sendPlayerUpdate(map: Map<String, Any?>? = null) =
    withContext(Dispatchers.Main) {
      val data = currentStatus()
      val body = map?.let { data + it } ?: data
      emit(PLAYBACK_STATUS_UPDATE, body)
    }

  private fun sendAudioSampleUpdate(sample: List<Float>) {
    val body = mapOf(
      "channels" to listOf(
        mapOf("frames" to sample)
      ),
      "timestamp" to player.currentPosition
    )
    emit(AUDIO_SAMPLE_UPDATE, body)
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

  private fun createVisualizer() {
    appContext?.reactContext?.let {
      if (ContextCompat.checkSelfPermission(it, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        Log.d(TAG, "\'android.permission.RECORD_AUDIO\' is required to use audio sampling. Please request this permission and try again.")
        return
      }
    }

    if (visualizer == null) {
      visualizer = Visualizer(player.audioSessionId).apply {
        captureSize = Visualizer.getCaptureSizeRange()[1]
        setDataCaptureListener(
          object : Visualizer.OnDataCaptureListener {
            override fun onWaveFormDataCapture(visualizer: Visualizer?, waveform: ByteArray?, samplingRate: Int) {
              waveform?.let {
                if (samplingEnabled) {
                  val data = extractAmplitudes(it)
                  sendAudioSampleUpdate(data)
                }
              }
            }

            override fun onFftDataCapture(visualizer: Visualizer?, fft: ByteArray?, samplingRate: Int) {
            }
          },
          Visualizer.getMaxCaptureRate() / 2,
          true,
          false
        )
        enabled = true
      }
    }
  }

  override fun sharedObjectDidRelease() {
    appContext?.mainQueue?.launch {
      playerScope.cancel()
      visualizer?.release()
      player.release()
    }
  }

  companion object {
    val TAG = AudioPlayer::class.simpleName
  }
}
