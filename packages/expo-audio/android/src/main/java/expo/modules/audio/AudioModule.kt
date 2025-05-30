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
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.min

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class AudioModule : Module() {
  private lateinit var audioManager: AudioManager
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val httpClient = OkHttpClient()

  private val players = ConcurrentHashMap<String, AudioPlayer>()
  private val recorders = ConcurrentHashMap<String, AudioRecorder>()
  private var staysActiveInBackground = false
  private var audioEnabled = true
  private var shouldRouteThroughEarpiece = false
  private var focusAcquired = false
  private var interruptionMode: InterruptionMode? = null

  private var audioFocusRequest: AudioFocusRequest? = null
  private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
    appContext.mainQueue.launch {
      when (focusChange) {
        AudioManager.AUDIOFOCUS_LOSS -> {
          focusAcquired = false
          players.values.forEach { player ->
            player.ref.pause()
          }
        }

        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
          focusAcquired = false
          players.values.forEach { player ->
            if (player.ref.isPlaying) {
              player.isPaused = true
              player.ref.pause()
            }
          }
        }

        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
          if (interruptionMode == InterruptionMode.DUCK_OTHERS) {
            players.values.forEach { player ->
              player.ref.volume /= 2f
            }
          } else {
            players.values.forEach { player ->
              if (player.ref.isPlaying) {
                player.isPaused = true
                player.ref.pause()
              }
            }
          }
        }

        AudioManager.AUDIOFOCUS_GAIN -> {
          focusAcquired = true
          players.values.forEach { player ->
            player.setVolume(player.previousVolume)
            if (player.isPaused) {
              player.isPaused = false
              player.ref.play()
            }
          }
        }
      }
    }
  }

  private fun shouldReleaseFocus(): Boolean {
    return players.values.none { it.ref.isPlaying }
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
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(audioFocusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
    }

    if (result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
      focusAcquired = true
    } else {
      Log.e(TAG, "Audio focus request failed with: $result")
    }
  }

  private fun releaseAudioFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest?.let {
        audioManager.abandonAudioFocusRequest(it)
      }
    } else {
      @Suppress("DEPRECATION")
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
        releaseAudioFocus()
        runOnMain {
          players.values.forEach {
            if (it.ref.isPlaying) {
              it.ref.pause()
            }
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
      if (!staysActiveInBackground) {
        releaseAudioFocus()
        players.values.forEach { player ->
          if (player.ref.isPlaying) {
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

    OnActivityEntersForeground {
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

    OnDestroy {
      appContext.mainQueue.launch {
        releaseAudioFocus()
        players.values.forEach {
          it.ref.stop()
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

      Property("id") { player ->
        player.id
      }

      Property("isBuffering") { player ->
        runOnMain {
          player.ref.playbackState == Player.STATE_BUFFERING
        }
      }

      Property("currentStatus") { player ->
        runOnMain {
          player.currentStatus()
        }
      }

      Property("isAudioSamplingSupported") { _ ->
        true
      }

      Property("loop") { player ->
        runOnMain {
          player.ref.repeatMode == Player.REPEAT_MODE_ONE
        }
      }.set { player, isLooping: Boolean ->
        runOnMain {
          player.ref.repeatMode = if (isLooping) {
            Player.REPEAT_MODE_ONE
          } else {
            Player.REPEAT_MODE_OFF
          }
        }
      }

      Property("isLoaded") { player ->
        runOnMain {
          player.ref.playbackState == Player.STATE_READY
        }
      }

      Property("playing") { player ->
        runOnMain {
          player.ref.isPlaying
        }
      }

      Property("muted") { player ->
        player.isMuted
      }.set { player, muted: Boolean? ->
        val newMuted = muted ?: false
        player.isMuted = newMuted
        player.setVolume(if (newMuted) 0f else player.previousVolume)
      }

      Property("shouldCorrectPitch") { player ->
        player.preservesPitch
      }.set { player, preservesPitch: Boolean ->
        player.preservesPitch = preservesPitch
      }

      Property("currentTime") { player ->
        runOnMain {
          player.currentTime
        }
      }

      Property("duration") { player ->
        runOnMain {
          player.duration
        }
      }

      Property("playbackRate") { player ->
        runOnMain {
          player.ref.playbackParameters.speed
        }
      }

      Property("volume") { player ->
        runOnMain {
          player.ref.volume
        }
      }.set { ref, volume: Float? ->
        ref.setVolume(volume)
      }

      Function("play") { player: AudioPlayer ->
        if (!audioEnabled) {
          Log.e(TAG, "Audio has been disabled. Re-enable to start playing")
          return@Function
        }
        runOnMain {
          if (!focusAcquired) {
            requestAudioFocus()
          }
          player.ref.play()
        }
      }

      Function("pause") { player: AudioPlayer ->
        runOnMain {
          player.ref.pause()

          if (shouldReleaseFocus()) {
            releaseAudioFocus()
          }
        }
      }

      Function("replace") { player: AudioPlayer, source: AudioSource ->
        runOnMain {
          if (player.ref.availableCommands.contains(Player.COMMAND_CHANGE_MEDIA_ITEMS)) {
            val mediaSource = createMediaItem(source)
            val wasPlaying = player.ref.isPlaying
            mediaSource?.let {
              player.setMediaSource(it)
              if (wasPlaying) {
                if (!focusAcquired) {
                  requestAudioFocus()
                }
                player.ref.play()
              }
            }
          }
        }
      }

      Function("setAudioSamplingEnabled") { player: AudioPlayer, enabled: Boolean ->
        runOnMain {
          player.setSamplingEnabled(enabled)
        }
      }

      AsyncFunction("seekTo") { player: AudioPlayer, seekTime: Double ->
        player.ref.seekTo((seekTime * 1000L).toLong())
      }.runOnQueue(Queues.MAIN)

      Function("setPlaybackRate") { player: AudioPlayer, rate: Float ->
        appContext.mainQueue.launch {
          val playbackRate = if (rate < 0) 0f else min(rate, 2.0f)
          val pitch = if (player.preservesPitch) 1f else playbackRate
          player.ref.playbackParameters = PlaybackParameters(playbackRate, pitch)
        }
      }

      Function("remove") { player: AudioPlayer ->
        val wasPlaying = player.ref.isPlaying
        players.remove(player.id)

        if (wasPlaying && shouldReleaseFocus()) {
          releaseAudioFocus()
        }
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

      Property("id") { recorder ->
        recorder.id
      }

      Property("uri") { recorder ->
        recorder.filePath?.let {
          Uri.fromFile(File(it)).toString()
        } ?: ""
      }

      Property("isRecording") { recorder ->
        recorder.isRecording
      }

      Property("currentTime") { recorder ->
        recorder.startTime
      }

      AsyncFunction("prepareToRecordAsync") { recorder: AudioRecorder, options: RecordingOptions? ->
        checkRecordingPermission()
        recorder.prepareRecording(options)
      }

      Function("record") { recorder: AudioRecorder ->
        checkRecordingPermission()
        if (recorder.isPrepared) {
          recorder.record()
        }
      }

      Function("pause") { recorder: AudioRecorder ->
        checkRecordingPermission()
        recorder.pauseRecording()
      }

      AsyncFunction("stop") { recorder: AudioRecorder ->
        checkRecordingPermission()
        recorder.stopRecording()
      }

      Function("getStatus") { recorder: AudioRecorder ->
        try {
          return@Function recorder.getAudioRecorderStatus()
        } catch (e: Exception) {
          throw e
        }
      }

      AsyncFunction("getCurrentInput") { recorder: AudioRecorder ->
        recorder.getCurrentInput(audioManager)
      }

      Function("getAvailableInputs") { recorder: AudioRecorder ->
        return@Function recorder.getAvailableInputs(audioManager)
      }

      Function("setInput") { recorder: AudioRecorder, input: String ->
        recorder.setInput(input, audioManager)
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

  @Suppress("DEPRECATION")
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
