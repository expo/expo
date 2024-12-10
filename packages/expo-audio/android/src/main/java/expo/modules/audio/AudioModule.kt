package expo.modules.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioManager
import android.net.Uri
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.media3.common.C.CONTENT_TYPE_DASH
import androidx.media3.common.C.CONTENT_TYPE_HLS
import androidx.media3.common.C.CONTENT_TYPE_OTHER
import androidx.media3.common.C.CONTENT_TYPE_SS
import androidx.media3.common.C.VOLUME_FLAG_ALLOW_RINGER_MODES
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

  override fun definition() = ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }

    AsyncFunction("setAudioModeAsync") { mode: AudioMode ->
      staysActiveInBackground = mode.shouldPlayInBackground
      shouldRouteThroughEarpiece = mode.shouldRouteThroughEarpiece ?: false
      updatePlaySoundThroughEarpiece(shouldRouteThroughEarpiece)
    }

    AsyncFunction("setIsAudioActiveAsync") { enabled: Boolean ->
      audioEnabled = enabled
      if (!enabled) {
        appContext.mainQueue.launch {
          players.values.forEach {
            if (it.player.isPlaying) {
              it.player.pause()
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
      if (!appIsPaused) {
        appIsPaused = true
        if (!staysActiveInBackground) {
          for (player in players.values) {
            if (player.player.isPlaying) {
              player.isPaused = true
              player.ref.pause()
            }
          }

          for (recorder in recorders.values) {
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
          for (player in players.values) {
            if (player.isPaused) {
              player.isPaused = false
              player.ref.play()
            }
          }

          for (recorder in recorders.values) {
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
        for (player in players.values) {
          player.player.stop()
        }

        for (recorder in recorders.values) {
          recorder.stopRecording()
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
        appContext.mainQueue.launch {
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

      Property("mute") { ref ->
        runOnMain {
          ref.player.isDeviceMuted
        }
      }.set { ref, muted: Boolean ->
        appContext.mainQueue.launch {
          ref.player.setDeviceMuted(muted, VOLUME_FLAG_ALLOW_RINGER_MODES)
        }
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
      }.set { ref, volume: Float ->
        appContext.mainQueue.launch {
          ref.player.volume = volume
        }
      }

      Function("play") { ref: AudioPlayer ->
        if (!audioEnabled) {
          Log.e(TAG, "Audio has been disabled. Re-enable to start playing")
          return@Function
        }
        appContext.mainQueue.launch {
          ref.player.play()
        }
      }

      Function("pause") { ref: AudioPlayer ->
        appContext.mainQueue.launch {
          ref.player.pause()
        }
      }

      Function("replace") { ref: AudioPlayer, source: AudioSource ->
        if (ref.player.availableCommands.contains(Player.COMMAND_CHANGE_MEDIA_ITEMS)) {
          val mediaSource = createMediaItem(source)
          ref.player.replaceMediaItem(0, mediaSource.mediaItem)
        }
      }

      Function("setAudioSamplingEnabled") { ref: AudioPlayer, enabled: Boolean ->
        appContext.mainQueue.launch {
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
        ref.uri
      }

      Property("isRecording") { ref ->
        ref.isRecording
      }

      Property("currentTime") { ref ->
        ref.uptime
      }

      AsyncFunction("prepareToRecordAsync") { ref: AudioRecorder, options: RecordingOptions? ->
        ref.prepareRecording(options)
      }

      Function("record") { ref: AudioRecorder ->
        checkRecordingPermission()
        ref.record()
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
        checkRecordingPermission()
        ref.getAudioRecorderStatus()
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

  private fun createMediaItem(source: AudioSource?): MediaSource {
    val isLocal = Util.isLocalFileUri(Uri.parse(source?.uri))
    val factory = if (isLocal) {
      DefaultDataSource.Factory(context)
    } else {
      OkHttpDataSource.Factory(httpClient).apply {
        source?.headers?.let {
          setDefaultRequestProperties(it)
        }
        DefaultDataSource.Factory(context, this)
      }
    }

    val item = MediaItem.fromUri(source?.uri ?: "")
    return buildMediaSourceFactory(factory, item)
  }

  private fun updatePlaySoundThroughEarpiece(playThroughEarpiece: Boolean) {
    audioManager.setMode(if (playThroughEarpiece) AudioManager.MODE_IN_COMMUNICATION else AudioManager.MODE_NORMAL)
    audioManager.setSpeakerphoneOn(!playThroughEarpiece)
  }

  private fun retrieveStreamType(uri: Uri): Int = Util.inferContentType(uri)

  private fun buildMediaSourceFactory(
    factory: DataSource.Factory,
    mediaItem: MediaItem
  ): MediaSource {
    val uri = mediaItem.localConfiguration?.uri
    val newFactory = when (val type = retrieveStreamType(uri!!)) {
      CONTENT_TYPE_SS -> SsMediaSource.Factory(factory)
      CONTENT_TYPE_DASH -> DashMediaSource.Factory(factory)
      CONTENT_TYPE_HLS -> HlsMediaSource.Factory(factory)
      CONTENT_TYPE_OTHER -> ProgressiveMediaSource.Factory(factory)
      else -> throw IllegalStateException("Unsupported type: $type")
    }
    return newFactory.createMediaSource(MediaItem.fromUri(uri))
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
