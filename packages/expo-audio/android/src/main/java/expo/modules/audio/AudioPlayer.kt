package expo.modules.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.audiofx.Visualizer
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.media3.common.AudioAttributes
import androidx.media3.common.MediaItem
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
import expo.modules.kotlin.sharedobjects.SharedRef
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference
import java.util.UUID

private const val PLAYBACK_STATUS_UPDATE = "playbackStatusUpdate"
private const val AUDIO_SAMPLE_UPDATE = "audioSampleUpdate"
private const val SEEK_JUMP_INTERVAL_MS: Long = 10_000

@UnstableApi
class AudioPlayer(
  context: Context,
  appContext: AppContext,
  source: MediaSource?,
  private val updateInterval: Double,
  bufferDurationMs: Long = 0
) : SharedRef<ExoPlayer>(
  ExoPlayer.Builder(context)
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
  appContext
),
  Playable {
  override val id = UUID.randomUUID().toString()
  var preservesPitch = true
  override var isPaused = false
  override var isMuted = false
  override var previousVolume = 1f
  override var onPlaybackStateChange: ((Boolean) -> Unit)? = null

  // Lock screen controls
  var isActiveForLockScreen = false
  internal var metadata: Metadata? = null
  internal var lockScreenOptions: AudioLockScreenOptions? = null
  internal var mediaSession: MediaSession = buildBasicMediaSession(context, ref)
  val serviceConnection = AudioPlaybackServiceConnection(WeakReference(this), appContext)

  private var playerScope = CoroutineScope(Dispatchers.Main)
  private var playerListener: Player.Listener? = null
  private var samplingEnabled = false
  private var visualizer: Visualizer? = null
  private var playing = false
  private val context by lazy {
    appContext.reactContext
      ?: throw Exceptions.ReactContextLost()
  }

  private var updateJob: Job? = null
  private var previousPlaybackState = Player.STATE_IDLE
  private var intendedPlayingState = false

  override val player get() = ref

  init {
    addPlayerListeners()
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

  private fun startUpdating() {
    updateJob?.cancel()
    updateJob = flow {
      while (true) {
        emit(Unit)
        delay(updateInterval.toLong())
      }
    }
      .onStart {
        sendPlayerUpdate()
      }
      .onEach {
        if (playing) {
          sendPlayerUpdate()
        }
      }
      .launchIn(playerScope)
  }

  private fun addPlayerListeners() {
    val listener = object : Player.Listener {
      override fun onIsPlayingChanged(isPlaying: Boolean) {
        playing = isPlaying
        onPlaybackStateChange?.invoke(isPlaying)

        val isTransient = !isPlaying &&
          (ref.playbackState == Player.STATE_ENDED || ref.playbackState == Player.STATE_BUFFERING)
        if (!isTransient) {
          intendedPlayingState = isPlaying
        }

        if (isTransient) {
          return
        }
        sendPlayerUpdate(mapOf("playing" to isPlaying))
      }

      override fun onIsLoadingChanged(isLoading: Boolean) {
        sendPlayerUpdate()
      }

      override fun onPlaybackStateChanged(playbackState: Int) {
        val justFinished = playbackState == Player.STATE_ENDED &&
          previousPlaybackState != Player.STATE_ENDED
        previousPlaybackState = playbackState

        if (justFinished) {
          intendedPlayingState = false
        }

        val updateMap = mutableMapOf<String, Any?>(
          "playbackState" to playbackStateToString(playbackState)
        )
        if (justFinished) {
          updateMap["didJustFinish"] = true
          updateMap["playing"] = false
        }
        sendPlayerUpdate(updateMap)
      }

      override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
        sendPlayerUpdate()
      }

      override fun onPositionDiscontinuity(
        oldPosition: Player.PositionInfo,
        newPosition: Player.PositionInfo,
        reason: Int
      ) {
        if (reason == Player.DISCONTINUITY_REASON_SEEK) {
          sendPlayerUpdate(mapOf("currentTime" to (newPosition.positionMs / 1000f)))
        }
      }
    }
    playerListener = listener
    ref.addListener(listener)
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
      "isBuffering" to isBuffering
    )
  }

  internal fun assignBasicMediaSession() {
    mediaSession.release()
    mediaSession = buildBasicMediaSession(context, ref)
  }

  private fun sendPlayerUpdate(map: Map<String, Any?>? = null) {
    val data = currentStatus()
    val body = map?.let { data + it } ?: data
    emit(PLAYBACK_STATUS_UPDATE, body)
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

  @OptIn(DelicateCoroutinesApi::class)
  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()

    serviceConnection.release()

    // Run on global scope (not appContext.mainQueue) so that reloading doesn't cancel the release process
    // https://github.com/expo/expo/blob/cdf592a7fea56fc01b0149e9b2e5dbd294bcdc4c/packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt#L277-L279
    GlobalScope.launch(Dispatchers.Main) {
      mediaSession.release()
      if (isActiveForLockScreen) {
        serviceConnection.playbackServiceBinder?.service?.unregisterPlayer()
      }
      serviceConnection.unbind()
      playerListener?.let { ref.removeListener(it) }
      playerScope.cancel()
      visualizer?.release()
      ref.release()
    }
  }

  companion object {
    val TAG = AudioPlayer::class.simpleName
  }
}
