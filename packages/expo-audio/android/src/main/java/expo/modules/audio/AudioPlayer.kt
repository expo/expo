package expo.modules.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.audiofx.Visualizer
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.session.MediaSession
import expo.modules.audio.service.AudioPlaybackServiceConnection
import expo.modules.audio.service.ServiceBindingState
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import java.lang.ref.WeakReference

private const val PLAYBACK_STATUS_UPDATE = "playbackStatusUpdate"
private const val AUDIO_SAMPLE_UPDATE = "audioSampleUpdate"
private const val SEEK_JUMP_INTERVAL_MS: Long = 10_000

@UnstableApi
class AudioPlayer(
  context: Context,
  appContext: AppContext,
  source: MediaSource?,
  updateInterval: Double,
  bufferDurationMs: Long = 0
) : BaseAudioPlayer(
  player = ExoPlayer.Builder(context)
    .setLooper(context.mainLooper)
    .setAudioAttributes(AudioAttributes.DEFAULT, false)
    .setSeekForwardIncrementMs(SEEK_JUMP_INTERVAL_MS)
    .setSeekBackIncrementMs(SEEK_JUMP_INTERVAL_MS)
    .apply {
      if (bufferDurationMs > 0) {
        setLoadControl(
          DefaultLoadControl.Builder()
            .setBufferDurationsMs(
              DefaultLoadControl.DEFAULT_MIN_BUFFER_MS,
              bufferDurationMs.toInt().coerceAtLeast(DefaultLoadControl.DEFAULT_MIN_BUFFER_MS),
              DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS,
              DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
            )
            .build()
        )
      }
    }
    .build(),
  appContext = appContext,
  updateInterval = updateInterval,
  statusEventName = PLAYBACK_STATUS_UPDATE
) {
  var preservesPitch = true

  // Lock screen controls
  var isActiveForLockScreen = false
  internal var metadata: Metadata? = null
  internal var lockScreenOptions: AudioLockScreenOptions? = null
  internal var mediaSession: MediaSession = buildBasicMediaSession(context, ref)
  val serviceConnection = AudioPlaybackServiceConnection(WeakReference(this), appContext)

  val isLive: Boolean
    get() = ref.isCurrentMediaItemLive

  val currentOffsetFromLive: Double?
    get() {
      val offset = ref.currentLiveOffset
      return if (offset == C.TIME_UNSET) null else offset / 1000.0
    }

  private var samplingEnabled = false
  private var visualizer: Visualizer? = null
  private val context by lazy {
    appContext.reactContext
      ?: throw Exceptions.ReactContextLost()
  }

  init {
    installPlayerListeners()
    source?.let {
      setMediaSource(source)
    }
  }

  fun setMediaSource(source: MediaSource) {
    previousPlaybackState = Player.STATE_IDLE
    ref.setMediaSource(source)
    ref.prepare()
    startUpdating()
  }

  fun setActiveForLockScreen(active: Boolean, metadata: Metadata? = null, options: AudioLockScreenOptions? = null) {
    if (active) {
      this.metadata = metadata
      this.lockScreenOptions = options
      this.isActiveForLockScreen = true

      if (serviceConnection.bindingState == ServiceBindingState.UNBOUND) {
        serviceConnection.bindWithService()
      }

      val serviceBinder = serviceConnection.playbackServiceBinder
      if (serviceBinder != null && serviceConnection.bindingState == ServiceBindingState.BOUND) {
        serviceBinder.service.setPlayerOptions(this, metadata, options)
      } else if (serviceConnection.bindingState == ServiceBindingState.BINDING) {
        // The settings will be applied when the service connects
      } else {
        appContext?.jsLogger?.error(
          getPlaybackServiceErrorMessage("Failed to activate lock screen controls - service binding failed")
        )
      }
    } else if (isActiveForLockScreen) {
      this.isActiveForLockScreen = false
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayer()
    }
  }

  fun updateLockScreenMetadata(metadata: Metadata) {
    if (isActiveForLockScreen) {
      this.metadata = metadata

      val serviceBinder = serviceConnection.playbackServiceBinder
      if (serviceBinder != null && serviceConnection.bindingState == ServiceBindingState.BOUND) {
        serviceBinder.service.setPlayerMetadata(this, metadata)
      } else {
        appContext?.jsLogger?.warn(
          getPlaybackServiceErrorMessage("Cannot update lock screen metadata - service not connected")
        )
      }
    }
  }

  fun clearLockScreenControls() {
    if (isActiveForLockScreen) {
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayer()
    }
  }

  override fun onPlaybackStateUpdated(playbackState: Int, justFinished: Boolean) {
    val updateMap = mutableMapOf<String, Any?>(
      "playbackState" to playbackStateToString(playbackState)
    )
    if (justFinished) {
      updateMap["didJustFinish"] = true
      updateMap["playing"] = false
    }
    sendStatusUpdate(updateMap)
  }

  override fun onPlayerError(error: PlaybackException) {
    sendStatusUpdate(
      mapOf(
        "error" to error.message
      )
    )
  }

  fun setSamplingEnabled(enabled: Boolean) {
    appContext?.reactContext?.let {
      if (ContextCompat.checkSelfPermission(it, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        Log.d(TAG, "\'android.permission.RECORD_AUDIO\' is required to use audio sampling. Please request this permission and try again.")
        return
      }
    }

    samplingEnabled = enabled
    if (enabled) {
      createVisualizer()
    } else {
      visualizer?.release()
      visualizer = null
    }
  }

  override fun setPlaybackRate(rate: Float) {
    val playbackRate = rate.coerceIn(0.1f, 2.0f)
    val pitch = if (preservesPitch) 1f else playbackRate
    ref.playbackParameters = PlaybackParameters(playbackRate, pitch)
  }

  private fun extractAmplitudes(chunk: ByteArray): List<Float> = chunk.map { byte ->
    val unsignedByte = byte.toInt() and 0xFF
    ((unsignedByte - 128).toDouble() / 128.0).toFloat()
  }

  override fun currentStatus(): Map<String, Any?> {
    val isMuted = ref.volume == 0f
    val isLooping = ref.repeatMode == Player.REPEAT_MODE_ONE
    val isLoaded = ref.playbackState == Player.STATE_READY
    val isBuffering = ref.playbackState == Player.STATE_BUFFERING
    val playingStatus = if (isBuffering) intendedPlayingState else ref.isPlaying

    return mapOf(
      "id" to id,
      "currentTime" to currentTime,
      "playbackState" to playbackStateToString(ref.playbackState),
      "timeControlStatus" to if (playingStatus) "playing" else "paused",
      "reasonForWaitingToPlay" to null,
      "mute" to isMuted,
      "duration" to duration,
      "playing" to playingStatus,
      "loop" to isLooping,
      "didJustFinish" to false,
      "isLoaded" to if (ref.playbackState == Player.STATE_ENDED) true else isLoaded,
      "playbackRate" to ref.playbackParameters.speed,
      "shouldCorrectPitch" to preservesPitch,
      "isBuffering" to isBuffering,
      "isLive" to isLive,
      "currentOffsetFromLive" to currentOffsetFromLive,
      "error" to null
    )
  }

  internal fun assignBasicMediaSession() {
    mediaSession.release()
    mediaSession = buildBasicMediaSession(context, ref)
  }

  private fun sendAudioSampleUpdate(sample: List<Float>) {
    val body = mapOf(
      "channels" to listOf(
        mapOf("frames" to sample)
      ),
      "timestamp" to ref.currentPosition
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
    // It must only be created once, otherwise the app will crash
    if (visualizer == null) {
      visualizer = Visualizer(ref.audioSessionId).apply {
        captureSize = Visualizer.getCaptureSizeRange()[1]
        setDataCaptureListener(
          object : Visualizer.OnDataCaptureListener {
            override fun onWaveFormDataCapture(visualizer: Visualizer?, waveform: ByteArray?, samplingRate: Int) {
              waveform?.let {
                if (samplingEnabled && ref.isPlaying) {
                  val data = extractAmplitudes(it)
                  sendAudioSampleUpdate(data)
                }
              }
            }

            override fun onFftDataCapture(visualizer: Visualizer?, fft: ByteArray?, samplingRate: Int) = Unit
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
    serviceConnection.release()
    super.sharedObjectDidRelease()
  }

  override fun releasePlayer() {
    mediaSession.release()
    if (isActiveForLockScreen) {
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayer()
    }
    serviceConnection.unbind()
    visualizer?.release()
    super.releasePlayer()
  }

  companion object {
    val TAG = AudioPlayer::class.simpleName
  }
}
