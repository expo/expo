package expo.modules.audio

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import androidx.core.content.ContextCompat
import androidx.media3.common.C.VOLUME_FLAG_ALLOW_RINGER_MODES
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import java.io.File
import java.io.IOException
import kotlin.math.min

const val recordingStatus = "onRecordingStatusUpdate"
const val playbackStatus = "onPlaybackStatusUpdate"

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class AudioModule : Module(), AudioManager.OnAudioFocusChangeListener {
  private val activity: Activity
    get() = appContext.activityProvider?.currentActivity ?: throw Exceptions.MissingActivity()
  private lateinit var audioManager: AudioManager

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
        runBlocking(appContext.mainQueue.coroutineContext) {
          AudioPlayer(
            activity.applicationContext,
            appContext,
            MediaItem.Builder()
              .setUri(source.uri ?: "")
              .build()
          )
        }
      }

      Property("id") { ref ->
        ref.sharedObjectId.value
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

      }

      Function("record") { ref: AudioRecorder ->
        checkRecordingPermission()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {

        } else {
          ref.recorder.start()
        }
      }

      Function("pause") { ref: AudioRecorder ->
        checkRecordingPermission()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          ref.recorder.pause()
        } else {
          ref.recorder.stop()
        }
      }

      Function("stop") { ref: AudioRecorder ->
        checkRecordingPermission()
        ref.recorder.stop()
      }

      Function("getStatus") { ref: AudioRecorder ->
        checkRecordingPermission()
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
