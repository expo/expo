package expo.modules.audio

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentResolver
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
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
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.RawResourceDataSource
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
class AudioModule : Module(), AudioManager.OnAudioFocusChangeListener {
  private val activity: Activity
    get() = appContext.activityProvider?.currentActivity ?: throw Exceptions.MissingActivity()
  private lateinit var audioManager: AudioManager
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }

    AsyncFunction("setAudioModeAsync") { mode: AudioMode ->
    }

    AsyncFunction("setIsAudioActiveAsync") { enabled: Boolean ->
      audioManager.abandonAudioFocus(this@AudioModule)
    }

    AsyncFunction("requestRecordingPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    AsyncFunction("getRecordingPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    Class(AudioPlayer::class) {
      Constructor { source: AudioSource ->
        val builder = OkHttpClient().newBuilder()
        val factory = OkHttpDataSource.Factory(builder.build()).apply {
          source.headers?.let {
            setDefaultRequestProperties(it)
          }
          DefaultDataSource.Factory(context, this)
        }

        val mediaSource = buildMediaSourceFactory(factory, Uri.parse(source.uri))
        runBlocking(appContext.mainQueue.coroutineContext) {
          AudioPlayer(
            context,
            appContext,
            mediaSource
          )
        }
      }

      Property("isBuffering") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.playbackState == Player.STATE_BUFFERING
        }
      }

      Property("loop") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
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
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.playbackState == Player.STATE_READY
        }
      }

      Property("isPlaying") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.isPlaying
        }
      }

      Property("muted") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
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
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.currentPosition
        }
      }

      Property("duration") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.duration
        }
      }

      Property("playbackRate") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.playbackParameters.speed
        }
      }

      Property("volume") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.volume
        }
      }.set { ref, volume: Float ->
        appContext.mainQueue.launch {
          ref.player.volume = volume
        }
      }

      Function("play") { ref: AudioPlayer ->
        appContext.mainQueue.launch {
          ref.player.play()
        }
      }

      Function("pause") { ref: AudioPlayer ->
        appContext.mainQueue.launch {
          ref.player.pause()
        }
      }

      AsyncFunction("seekTo") { ref: AudioPlayer, seekTime: Double ->
        ref.player.seekTo(seekTime.toLong())
      }.runOnQueue(Queues.MAIN)

      Function("setPlaybackRate") { ref: AudioPlayer, rate: Float ->
        appContext.mainQueue.launch {
          val playbackRate = if (rate < 0) 0f else min(rate, 2.0f)
          val pitch = if (ref.preservesPitch) 1f else playbackRate
          ref.player.playbackParameters = PlaybackParameters(playbackRate, pitch)
        }
      }
    }

    Class(AudioRecorder::class) {
      Constructor { options: RecordingOptions ->
        AudioRecorder(
          activity.applicationContext,
          appContext,
          options
        )
      }

      Property("isRecording") { ref ->
        ref.isRecording
      }

      Property("currentTime") { ref ->
        ref.uptime
      }

      Function("record") { ref: AudioRecorder ->
        checkRecordingPermission()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          if (ref.isRecording) {
            ref.recorder.resume()
          } else {
            ref.isRecording = true
            ref.recorder.start()
          }
        } else {
          ref.isRecording = true
          ref.recorder.start()
        }
        ref.uptime = SystemClock.uptimeMillis()
      }

      Function("pause") { ref: AudioRecorder ->
        checkRecordingPermission()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          ref.recorder.pause()
          ref.isRecording = false
        } else {
        }
      }

      Function("stop") { ref: AudioRecorder ->
        checkRecordingPermission()
        ref.isRecording = false
        ref.recorder.stop()
      }

      Function("getStatus") { ref: AudioRecorder ->
        checkRecordingPermission()
        ref.getAudioRecorderStatus()
      }

      Function("getAvailableInputs") {
        return@Function getAvailableInputs()
      }
    }
  }

  private fun getAvailableInputs() = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS).mapNotNull { deviceInfo ->
    val type = deviceInfo.type
    if (type == AudioDeviceInfo.TYPE_BUILTIN_MIC || type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || type == AudioDeviceInfo.TYPE_WIRED_HEADSET) {
      getMapFromDeviceInfo(deviceInfo)
    } else {
      null
    }
  }

  private fun retrieveStreamType(uri: Uri): Int =
    Util.inferContentType(uri)

  private fun buildMediaSourceFactory(
    factory: DataSource.Factory,
    uri: Uri
  ): MediaSource {
    var newUri = uri
    try {
      if (uri.scheme == null) {
        val resourceId: Int = context.resources?.getIdentifier(uri.toString(), "raw", context.packageName)
          ?: 0
        newUri = Uri.Builder().scheme(ContentResolver.SCHEME_ANDROID_RESOURCE).path(resourceId.toString()).build()
      }
    } catch (e: Exception) {
      Log.e("AudioModule", "Error reading raw resource from ExoPlayer", e)
    }
    val source =  when (val type = retrieveStreamType(newUri)) {
      CONTENT_TYPE_SS -> SsMediaSource.Factory(factory)
      CONTENT_TYPE_DASH -> DashMediaSource.Factory(factory)
      CONTENT_TYPE_HLS -> HlsMediaSource.Factory(factory)
      CONTENT_TYPE_OTHER -> ProgressiveMediaSource.Factory(factory)
      else -> throw IllegalStateException("Unsupported type: $type");
    }
    return source.createMediaSource(MediaItem.fromUri(uri))
  }

  private fun checkRecordingPermission() {
    val permission = ContextCompat.checkSelfPermission(activity.applicationContext, Manifest.permission.RECORD_AUDIO)
    if (permission != PackageManager.PERMISSION_GRANTED) {
      throw AudioPermissionsException()
    }
  }

  @SuppressLint("SwitchIntDef")
  private fun getMapFromDeviceInfo(deviceInfo: AudioDeviceInfo): Bundle {
    val map = Bundle()
    val type = deviceInfo.type
    var typeStr = type.toString()
    when (type) {
      AudioDeviceInfo.TYPE_BUILTIN_MIC -> {
        typeStr = "MicrophoneBuiltIn"
      }

      AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> {
        typeStr = "BluetoothSCO"
      }

      AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> {
        typeStr = "BluetoothA2DP"
      }

      AudioDeviceInfo.TYPE_TELEPHONY -> {
        typeStr = "Telephony"
      }

      AudioDeviceInfo.TYPE_WIRED_HEADSET -> {
        typeStr = "MicrophoneWired"
      }
    }
    map.putString("name", deviceInfo.getProductName().toString())
    map.putString("type", typeStr)
    map.putString("uid", deviceInfo.id.toString())
    return map
  }

  override fun onAudioFocusChange(focusChange: Int) {
//    when (focusChange) {
//      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
//        if (mShouldDuckAudio) {
//          mIsDuckingAudio = true
//          mAcquiredAudioFocus = true
//          updateDuckStatusForAllPlayersPlaying()
//          break
//        }
//        mIsDuckingAudio = false
//        mAcquiredAudioFocus = false
//        for (handler in getAllRegisteredAudioEventHandlers()) {
//          handler.handleAudioFocusInterruptionBegan()
//        }
//      }
//
//      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT, AudioManager.AUDIOFOCUS_LOSS -> {
//        mIsDuckingAudio = false
//        mAcquiredAudioFocus = false
//        for (handler in getAllRegisteredAudioEventHandlers()) {
//          handler.handleAudioFocusInterruptionBegan()
//        }
//      }
//
//      AudioManager.AUDIOFOCUS_GAIN -> {
//        mIsDuckingAudio = false
//        mAcquiredAudioFocus = true
//        for (handler in getAllRegisteredAudioEventHandlers()) {
//          handler.handleAudioFocusGained()
//        }
//      }
//    }
  }
}
