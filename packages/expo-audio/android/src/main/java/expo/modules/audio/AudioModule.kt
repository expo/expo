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
import androidx.core.net.toUri

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
        for (player in players.values) {
          player.player.stop()
        }

        for (recorder in recorders.values) {
          recorder.stopRecording()
        }
      }
    }

    Class(AudioPlayer::class) {
      Constructor { sources: List<AudioSource>?, updateInterval: Double ->
        runOnMain {
          val player = AudioPlayer(
            context,
            appContext,
            updateInterval
          )
          players[player.id] = player

          if (sources != null && sources.isNotEmpty()) {
            val mediaItems = createMediaItems(sources)

            if (mediaItems.isNotEmpty()) {
              player.player.setMediaItems(mediaItems)
              player.player.prepare()
            }
          }

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
              ref.player.clearMediaItems() // clear potential queued tracks
              ref.player.setMediaItem(it.mediaItem)
              if (wasPlaying) {
                ref.player.play()
              }
            }
          }
        }
      }

      Function("setQueue") { ref: AudioPlayer, sources: List<AudioSource> ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_CHANGE_MEDIA_ITEMS)) {
            val mediaItems = createMediaItems(sources)

            if (mediaItems.isNotEmpty()) {
              ref.player.clearMediaItems()
              ref.player.setMediaItems(mediaItems)
              ref.player.prepare()
            }
          }
        }
      }

      Function("addToQueue") { ref: AudioPlayer, sources: List<AudioSource>, insertBeforeIndex: Int? ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_CHANGE_MEDIA_ITEMS)) {
            val mediaItems = createMediaItems(sources)

            if (insertBeforeIndex != null) {
              ref.player.addMediaItems(insertBeforeIndex, mediaItems)
            } else {
              ref.player.addMediaItems(mediaItems)
            }
          }
        }
      }

      Function("removeFromQueue") { ref: AudioPlayer, sources: List<AudioSource> ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_CHANGE_MEDIA_ITEMS)) {
            val mediaItems = createMediaItems(sources)

            ref.removeFromQueue(mediaItems)
          }
        }
      }

      Function("getCurrentQueue") { ref: AudioPlayer ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_GET_TIMELINE)) {
            val currentMediaItems = ref.getCurrentQueue()

            // convert MediaItem to AudioSource
            currentMediaItems.map { mediaItem ->
              val uri = mediaItem.localConfiguration?.uri?.toString() ?: ""
              AudioSource(uri = uri, headers = null)
            }
          } else {
            emptyList()
          }
        }
      }

      Function("getCurrentQueueIndex") { ref: AudioPlayer ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_GET_TIMELINE)) {
            ref.player.currentMediaItemIndex
          }
        }
      }

      Function("clearQueue") { ref: AudioPlayer ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_CHANGE_MEDIA_ITEMS)) {
            ref.player.clearMediaItems()
            ref.player.stop()
          }
        }
      }

      Function("skipToNext") { ref: AudioPlayer ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_SEEK_TO_NEXT)) {
            ref.player.seekToNextMediaItem()
          }
        }
      }

      Function("skipToPrevious") { ref: AudioPlayer ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_SEEK_TO_PREVIOUS)) {
            ref.player.seekToPreviousMediaItem()
          }
        }
      }

      Function("skipToQueueIndex") { ref: AudioPlayer, index: Int ->
        runOnMain {
          if (ref.player.availableCommands.contains(Player.COMMAND_SEEK_TO_MEDIA_ITEM)) {
            if (index >= 0 && index < ref.player.mediaItemCount) {
              ref.player.seekTo(index, 0)
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
        ref.filePath
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

  private fun createMediaItem(source: AudioSource?): MediaSource? = source?.uri?.let { uri ->
    val factory = createDataSourceFactory(source)
    val sourceUri = if (Util.isLocalFileUri(uri.toUri())) {
      Uri.fromFile(File(source.uri))
    } else {
      source.uri.toUri()
    }
    val item = MediaItem.fromUri(sourceUri)
    buildMediaSourceFactory(factory, item)
  }

  fun createMediaItems(sources: List<AudioSource>): List<MediaItem> {
    return sources.mapNotNull { source ->
      createMediaItem(source)?.mediaItem
    }
  }

  private fun createDataSourceFactory(audioSource: AudioSource): DataSource.Factory {
    val uri = if (Util.isLocalFileUri(Uri.parse(audioSource.uri))) {
      Uri.fromFile(File(audioSource.uri))
    } else {
      Uri.parse(audioSource.uri)
    }
    val isLocal = Util.isLocalFileUri(uri)
    return if (isLocal) {
      DefaultDataSource.Factory(context)
    } else {
      OkHttpDataSource.Factory(httpClient).apply {
        audioSource.headers?.let { headers ->
          setDefaultRequestProperties(headers)
        }
      }
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
