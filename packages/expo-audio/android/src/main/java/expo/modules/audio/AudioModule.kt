package expo.modules.audio

import android.Manifest
import android.content.ContentResolver
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.media3.common.C.CONTENT_TYPE_DASH
import androidx.media3.common.C.CONTENT_TYPE_HLS
import androidx.media3.common.C.CONTENT_TYPE_OTHER
import androidx.media3.common.C.CONTENT_TYPE_SS
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.Util
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.smoothstreaming.SsMediaSource
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import java.io.File
import kotlin.math.min

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class AudioModule : Module() {
  private lateinit var audioManager: AudioManager
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val httpClient = OkHttpClient()

  private val players = mutableMapOf<String, AudioPlayer>()
  private val recorders = mutableMapOf<String, AudioRecorder>()
  private var appIsPaused = false
  private var staysActiveInBackground = false
  private var audioEnabled = true
  private var shouldRouteThroughEarpiece = false
  private var focusAcquired = false
  private var interruptionMode: InterruptionMode? = null

  private var audioFocusRequest: AudioFocusRequest? = null
  private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
    when (focusChange) {
      AudioManager.AUDIOFOCUS_LOSS,
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
        focusAcquired = false
        players.values.forEach {
          it.player.pause()
        }
      }

      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
        focusAcquired = false
        if (interruptionMode == InterruptionMode.DUCK_OTHERS) {
          players.values.forEach {
            it.player.volume /= 2f
          }
        }
      }

      AudioManager.AUDIOFOCUS_GAIN -> {
        focusAcquired = true
        players.values.forEach {
          it.setVolume(it.previousVolume)
        }
      }
    }
  }

  private fun requestAudioFocus() {
    if (focusAcquired || !audioEnabled) {
      return
    }

    val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val requestType = interruptionMode?.let {
        if (it == InterruptionMode.DO_NOT_MIX) {
          AudioManager.AUDIOFOCUS_GAIN
        } else {
          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
        }
      } ?: AudioManager.AUDIOFOCUS_GAIN
      val audioFocusRequest = AudioFocusRequest.Builder(requestType).run {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build()
        )
        setAcceptsDelayedFocusGain(true)
        setOnAudioFocusChangeListener(audioFocusChangeListener)
        build()
      }
      audioFocusRequest?.let {
        audioManager.requestAudioFocus(it)
      }
    } else {
      audioManager.requestAudioFocus(audioFocusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
    }

    if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
      Log.e(TAG, "Audio focus request failed")
    }
  }

  private fun releaseAudioFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest?.let {
        audioManager.abandonAudioFocusRequest(it)
      }
    } else {
      audioManager.abandonAudioFocus(audioFocusChangeListener)
    }
    focusAcquired = false
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }

    AsyncFunction("setAudioModeAsync") { mode: AudioMode ->
      staysActiveInBackground = mode.shouldPlayInBackground
      interruptionMode = mode.interruptionMode
      updatePlaySoundThroughEarpiece(mode.shouldRouteThroughEarpiece ?: false)
    }

    AsyncFunction("setIsAudioActiveAsync") { enabled: Boolean ->
      audioEnabled = enabled
      if (!enabled) {
        appContext.mainQueue.launch {
          players.values.forEach {
            if (it.player.isPlaying) {
              it.player.pause()
            }
            releaseAudioFocus()
          }
        }
      }
    }

    AsyncFunction("requestRecordingPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    AsyncFunction("getRecordingPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    OnActivityEntersBackground {
      if (!appIsPaused) {
        appIsPaused = true
        if (!staysActiveInBackground) {
          releaseAudioFocus()
          players.values.forEach { player ->
            if (player.player.isPlaying) {
              player.isPaused = true
              player.ref.pause()
            }
          }

          recorders.values.forEach { recorder ->
            if (recorder.isRecording) {
              recorder.pauseRecording()
            }
          }
        }
      }
    }

    OnActivityEntersForeground {
      if (appIsPaused) {
        appIsPaused = false
        if (!staysActiveInBackground) {
          requestAudioFocus()
          players.values.forEach { player ->
            if (player.isPaused) {
              player.isPaused = false
              player.ref.play()
            }
          }

          recorders.values.forEach { recorder ->
            if (recorder.isPaused) {
              recorder.record()
            }
          }

          if (shouldRouteThroughEarpiece) {
            updatePlaySoundThroughEarpiece(true)
          }
        }
      }
    }

    OnDestroy {
      appContext.mainQueue.launch {
        releaseAudioFocus()
        players.values.forEach {
          it.player.stop()
        }

        recorders.values.forEach {
          it.stopRecording()
        }
      }
    }

    Class(AudioPlayer::class) {
      Constructor { source: AudioSource?, updateInterval: Double ->
        val mediaSource = createMediaItem(source)
        runOnMain {
          val player = AudioPlayer(
            context,
            appContext,
            mediaSource,
            updateInterval
          )
          players[player.id] = player
          player
        }
      }

      Property("id") { ref ->
        ref.id
      }

      Property("isBuffering") { ref ->
        runOnMain {
          ref.player.playbackState == Player.STATE_BUFFERING
        }
      }

      Property("currentStatus") { ref ->
        runOnMain {
          ref.currentStatus()
        }
      }

      Property("isAudioSamplingSupported") { _ ->
        true
      }

      Property("loop") { ref ->
        runOnMain {
          ref.player.repeatMode == Player.REPEAT_MODE_ONE
        }
      }.set { ref, isLooping: Boolean ->
        runOnMain {
          ref.player.repeatMode = if (isLooping) {
            Player.REPEAT_MODE_ONE
          } else {
            Player.REPEAT_MODE_OFF
          }
        }
      }

      Property("isLoaded") { ref ->
        runOnMain {
          ref.player.playbackState == Player.STATE_READY
        }
      }

      Property("playing") { ref ->
        runOnMain {
          ref.player.isPlaying
        }
      }

      Property("muted") { ref ->
        ref.isMuted
      }.set { ref, muted: Boolean? ->
        val newMuted = muted ?: false
        ref.isMuted = newMuted
        ref.setVolume(if (newMuted) 0f else ref.previousVolume)
      }

      Property("shouldCorrectPitch") { ref ->
        ref.preservesPitch
      }.set { ref, preservesPitch: Boolean ->
        ref.preservesPitch = preservesPitch
      }

      Property("currentTime") { ref ->
        runOnMain {
          ref.currentTime
        }
      }

      Property("duration") { ref ->
        runOnMain {
          ref.duration
        }
      }

      Property("playbackRate") { ref ->
        runOnMain {
          ref.player.playbackParameters.speed
        }
      }

      Property("volume") { ref ->
        runOnMain {
          ref.player.volume
        }
      }.set { ref, volume: Float? ->
        ref.setVolume(volume)
      }

      Function("play") { ref: AudioPlayer ->
        if (!audioEnabled) {
          Log.e(TAG, "Audio has been disabled. Re-enable to start playing")
          return@Function
        }
        runOnMain {
          if (!focusAcquired && players.values.any { it.player.isPlaying }) {
            requestAudioFocus()
          }
          ref.player.play()
        }
      }

      Function("pause") { ref: AudioPlayer ->
        runOnMain {
          ref.player.pause()
        }
      }

      Function("replace") { ref: AudioPlayer, source: AudioSource ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_CHANGE_MEDIA_ITEMS)) {
            val mediaSource = createMediaItem(source)
            val wasPlaying = ref.player.isPlaying
            mediaSource?.let {
              ref.setMediaSource(it)
              if (wasPlaying) {
                if (!focusAcquired) {
                  requestAudioFocus()
                }
                ref.player.play()
              }
            }
          }
        }
      }

      Function("setAudioSamplingEnabled") { ref: AudioPlayer, enabled: Boolean ->
        runOnMain {
          ref.setSamplingEnabled(enabled)
        }
      }

      AsyncFunction("seekTo") { ref: AudioPlayer, seekTime: Double ->
        ref.player.seekTo((seekTime * 1000L).toLong())
      }.runOnQueue(Queues.MAIN)

      Function("setPlaybackRate") { ref: AudioPlayer, rate: Float ->
        appContext.mainQueue.launch {
          val playbackRate = if (rate < 0) 0f else min(rate, 2.0f)
          val pitch = if (ref.preservesPitch) 1f else playbackRate
          ref.player.playbackParameters = PlaybackParameters(playbackRate, pitch)
        }
      }

      Function("remove") { ref: AudioPlayer ->
        players.remove(ref.id)
      }
    }

    Class(AudioRecorder::class) {
      Constructor { options: RecordingOptions ->
        val recorder = AudioRecorder(
          appContext.throwingActivity.applicationContext,
          appContext,
          options
        )
        recorders[recorder.id] = recorder
        recorder
      }

      Property("id") { ref ->
        ref.id
      }

      Property("uri") { ref ->
        ref.filePath?.let {
          Uri.fromFile(File(it)).toString()
        } ?: ""
      }

      Property("isRecording") { ref ->
        ref.isRecording
      }

      Property("currentTime") { ref ->
        ref.startTime
      }

      AsyncFunction("prepareToRecordAsync") { ref: AudioRecorder, options: RecordingOptions? ->
        checkRecordingPermission()
        ref.prepareRecording(options)
      }

      Function("record") { ref: AudioRecorder ->
        checkRecordingPermission()
        if (ref.isPrepared) {
          ref.record()
        }
      }

      Function("pause") { ref: AudioRecorder ->
        checkRecordingPermission()
        ref.pauseRecording()
      }

      AsyncFunction("stop") { ref: AudioRecorder ->
        checkRecordingPermission()
        ref.stopRecording()
      }

      Function("getStatus") { ref: AudioRecorder ->
        try {
          return@Function ref.getAudioRecorderStatus()
        } catch (e: Exception) {
          throw e
        }
      }

      AsyncFunction("getCurrentInput") { ref: AudioRecorder ->
        ref.getCurrentInput(audioManager)
      }

      Function("getAvailableInputs") { ref: AudioRecorder ->
        return@Function ref.getAvailableInputs(audioManager)
      }

      Function("setInput") { ref: AudioRecorder, input: String ->
        ref.setInput(input, audioManager)
      }
    }
  }

  private fun createMediaItem(source: AudioSource?): MediaSource? = source?.uri?.let { uriString ->
    val uri = uriString.toUri()
    val mediaItem = when (uri.scheme) {
      null -> MediaItem.fromUri(getRawResourceURI(uriString))
      else -> MediaItem.fromUri(uri)
    }

    val factory = when (uri.scheme) {
      "http", "https" -> httpDataSourceFactory(source.headers)
      else -> DefaultDataSource.Factory(context)
    }
    return buildMediaSourceFactory(factory, mediaItem)
  }

  private fun httpDataSourceFactory(headers: Map<String, String>?): DataSource.Factory {
    return OkHttpDataSource.Factory(httpClient).apply {
      headers?.let { headers ->
        setDefaultRequestProperties(headers)
      }
    }
  }

  private fun getRawResourceURI(file: String): Uri {
    val resId = context.resources.getIdentifier(file, "raw", context.packageName)

    return when {
      resId == 0 ->
        Uri.fromFile(File(file))
      else ->
        Uri.Builder()
          .scheme(ContentResolver.SCHEME_ANDROID_RESOURCE)
          .authority(context.packageName)
          .appendPath("raw")
          .appendPath(file)
          .build()
    }
  }

  private fun updatePlaySoundThroughEarpiece(playThroughEarpiece: Boolean) {
    audioManager.mode = if (playThroughEarpiece) AudioManager.MODE_IN_COMMUNICATION else AudioManager.MODE_NORMAL
    audioManager.setSpeakerphoneOn(!playThroughEarpiece)
  }

  private fun retrieveStreamType(uri: Uri): Int = Util.inferContentType(uri)

  private fun buildMediaSourceFactory(
    factory: DataSource.Factory,
    mediaItem: MediaItem
  ): MediaSource {
    val uri = mediaItem.localConfiguration?.uri
    return when (val type = uri?.let { retrieveStreamType(it) }) {
      CONTENT_TYPE_SS -> SsMediaSource.Factory(factory)
      CONTENT_TYPE_DASH -> DashMediaSource.Factory(factory)
      CONTENT_TYPE_HLS -> HlsMediaSource.Factory(factory)
      CONTENT_TYPE_OTHER -> ProgressiveMediaSource.Factory(factory)
      else -> throw IllegalStateException("Unsupported type: $type")
    }.createMediaSource(mediaItem)
  }

  private fun <T> runOnMain(block: () -> T): T =
    runBlocking(appContext.mainQueue.coroutineContext) { block() }

  private fun checkRecordingPermission() {
    val permission = ContextCompat.checkSelfPermission(appContext.throwingActivity.applicationContext, Manifest.permission.RECORD_AUDIO)
    if (permission != PackageManager.PERMISSION_GRANTED) {
      throw AudioPermissionsException()
    }
  }

  companion object {
    val TAG: String = AudioModule::class.java.simpleName
  }
}
