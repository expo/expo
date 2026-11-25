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
import expo.modules.v2.legacyAppContext
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

private const val SEEK_JUMP_INTERVAL_MS: Long = 10_000

@UnstableApi
@ExpoSharedObject
class AudioPlayer @JS constructor(
  source: AudioSource?,
  updateInterval: Double,
  keepAudioSessionActive: Boolean,
  preferredForwardBufferDuration: Double,
  @Suppress("UNUSED_PARAMETER") allowsExternalPlayback: Boolean?
) : BaseAudioPlayer(updateInterval),
  LockScreenPlayable {
  private val module: AudioModule = context.module<AudioModule>() ?: throw AudioModuleNotFoundException()
  private val mediaSource = module.createMediaItem(source)
  override val ref: ExoPlayer = module.runOnMain {
    buildPlayer(androidContext, (preferredForwardBufferDuration * 1000).toLong())
  }

  @Event(name = "playbackStatusUpdate")
  private val onPlaybackStatusUpdate = event<Map<String, Any?>>(onStartObserving = { sendStatusUpdateOnMain() })

  @Event(name = "audioSampleUpdate")
  private val onAudioSampleUpdate = event<Map<String, Any?>>()

  var preservesPitch = true
  var keepAudioSessionActive = false

  // Lock screen controls
  override var isActiveForLockScreen = false
  override var metadata: Metadata? = null
  override var lockScreenOptions: AudioLockScreenOptions? = null
  override var mediaSession: MediaSession = module.runOnMain { buildBasicMediaSession(androidContext, ref) { requestPlay() } }
  override val serviceConnection = AudioPlaybackServiceConnection(WeakReference(this), legacyAppContext)

  override val isLive: Boolean
    get() = ref.isCurrentMediaItemLive

  val currentOffsetFromLive: Double?
    get() {
      val offset = ref.currentLiveOffset
      return if (offset == C.TIME_UNSET) {
        null
      } else {
        offset / 1000.0
      }
    }

  private var samplingEnabled = false
  private var visualizer: Visualizer? = null

  init {
    module.runOnMain {
      installPlayerListeners()
      mediaSource?.let {
        setMediaSource(it)
      }
      module.registerPlayer(this, keepAudioSessionActive)
    }
  }

  @JS("id")
  val idFromJS: String
    get() = id

  @JS("isBuffering")
  val isBufferingFromJS: Boolean
    get() = module.runOnMain { ref.playbackState == Player.STATE_BUFFERING }

  @JS("currentStatus")
  val currentStatusFromJS: Map<String, Any?>
    get() = module.runOnMain { currentStatus() }

  @JS("isAudioSamplingSupported")
  val isAudioSamplingSupportedFromJS: Boolean
    get() = true

  @JS("loop")
  var loopFromJS: Boolean
    get() = module.runOnMain { ref.repeatMode == Player.REPEAT_MODE_ONE }
    set(isLooping) {
      module.runOnMain {
        ref.repeatMode = if (isLooping) {
          Player.REPEAT_MODE_ONE
        } else {
          Player.REPEAT_MODE_OFF
        }
      }
    }

  @JS("isLoaded")
  val isLoadedFromJS: Boolean
    get() = module.runOnMain { ref.playbackState == Player.STATE_READY }

  @JS("playing")
  val playingFromJS: Boolean
    get() = module.runOnMain { ref.isPlaying }

  @JS("paused")
  val pausedFromJS: Boolean
    get() = module.runOnMain { !ref.isPlaying }

  @JS("muted")
  var mutedFromJS: Boolean?
    get() = isMuted
    set(muted) {
      val newMuted = muted ?: false
      isMuted = newMuted
      setVolume(
        if (newMuted) {
          0f
        } else {
          previousVolume
        }
      )
    }

  @JS("shouldCorrectPitch")
  var shouldCorrectPitchFromJS: Boolean
    get() = preservesPitch
    set(value) {
      preservesPitch = value
    }

  @JS("currentTime")
  val currentTimeFromJS: Double
    get() = module.runOnMain { currentTime }

  @JS("duration")
  val durationFromJS: Double
    get() = module.runOnMain { duration }

  @JS("playbackRate")
  var playbackRatePropertyFromJS: Float
    get() = module.runOnMain { ref.playbackParameters.speed }
    set(rate) {
      module.appContext.mainQueue.launch {
        setPlaybackRate(rate)
      }
    }

  @JS("volume")
  var volumeFromJS: Float?
    get() = module.runOnMain { ref.volume }
    set(volume) {
      setVolume(volume)
    }

  @JS("isActiveForLockScreen")
  val isActiveForLockScreenFromJS: Boolean
    get() = module.runOnMain { isActiveForLockScreen }

  @JS("play")
  fun playFromJS() {
    module.runOnMain {
      module.playWithAudioFocus(this)
    }
  }

  @JS("pause")
  fun pauseFromJS() {
    module.pause(this)
  }

  @JS("replace")
  fun replaceFromJS(source: AudioSource?) {
    module.replace(this, source)
  }

  @JS("setActiveForLockScreen")
  fun setActiveForLockScreenFromJS(active: Boolean, metadata: Metadata?, options: AudioLockScreenOptions?) {
    module.runOnMain {
      setActiveForLockScreen(active, metadata, options)
    }
  }

  @JS("updateLockScreenMetadata")
  fun updateLockScreenMetadataFromJS(metadata: Metadata) {
    module.runOnMain {
      updateLockScreenMetadata(metadata)
    }
  }

  @JS("clearLockScreenControls")
  fun clearLockScreenControlsFromJS() {
    module.runOnMain {
      clearLockScreenControls()
    }
  }

  @JS("setAudioSamplingEnabled")
  fun setAudioSamplingEnabledFromJS(enabled: Boolean) {
    module.runOnMain {
      setSamplingEnabled(enabled)
    }
  }

  @JS("seekTo")
  suspend fun seekToFromJS(
    seekTime: Double,
    @Suppress("UNUSED_PARAMETER") toleranceMillisBefore: Double?,
    @Suppress("UNUSED_PARAMETER") toleranceMillisAfter: Double?
  ): Unit = withContext(Dispatchers.Main) {
    seekTo(seekTime)
  }

  @JS("setPlaybackRate")
  fun setPlaybackRateFromJS(rate: Float) {
    module.appContext.mainQueue.launch {
      setPlaybackRate(rate)
    }
  }

  @JS("remove")
  fun removeFromJS() {
    module.runOnMain {
      module.removePlayer(id)
    }
  }

  override fun emitStatus(body: Map<String, Any?>) {
    onPlaybackStatusUpdate(body)
  }

  fun setMediaSource(source: MediaSource) {
    previousPlaybackState = Player.STATE_IDLE
    ref.setMediaSource(source)
    ref.prepare()
    startUpdating()
  }

  fun clearMediaSource() {
    previousPlaybackState = Player.STATE_IDLE
    ref.pause()
    ref.clearMediaItems()
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
    val pitch = if (preservesPitch) {
      1f
    } else {
      playbackRate
    }
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
    val playingStatus = if (isBuffering) {
      intendedPlayingState
    } else {
      ref.isPlaying
    }

    return mapOf(
      "id" to id,
      "currentTime" to currentTime,
      "playbackState" to playbackStateToString(ref.playbackState),
      "timeControlStatus" to if (playingStatus) {
        "playing"
      } else {
        "paused"
      },
      "reasonForWaitingToPlay" to null,
      "mute" to isMuted,
      "duration" to duration,
      "playing" to playingStatus,
      "loop" to isLooping,
      "didJustFinish" to false,
      "isLoaded" to if (ref.playbackState == Player.STATE_ENDED) {
        true
      } else {
        isLoaded
      },
      "playbackRate" to ref.playbackParameters.speed,
      "shouldCorrectPitch" to preservesPitch,
      "isBuffering" to isBuffering,
      "isLive" to isLive,
      "currentOffsetFromLive" to currentOffsetFromLive,
      "error" to null
    )
  }

  override fun assignBasicMediaSession() {
    mediaSession.release()
    mediaSession = buildBasicMediaSession(androidContext, ref) { requestPlay() }
  }

  private fun sendAudioSampleUpdate(sample: List<Float>) {
    val body = mapOf(
      "channels" to listOf(
        mapOf("frames" to sample)
      ),
      "timestamp" to ref.currentPosition
    )
    onAudioSampleUpdate(body)
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
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayable()
    }
    serviceConnection.unbind()
    visualizer?.release()
    super.releasePlayer()
  }

  companion object {
    val TAG = AudioPlayer::class.simpleName

    private fun buildPlayer(context: Context, bufferDurationMs: Long): ExoPlayer =
      ExoPlayer.Builder(context, AudioRenderersFactory(context))
        .setLooper(context.mainLooper)
        .setAudioAttributes(AudioAttributes.DEFAULT, false)
        .setHandleAudioBecomingNoisy(true)
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
        .build()
  }
}
