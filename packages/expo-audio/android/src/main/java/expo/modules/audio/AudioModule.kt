package expo.modules.audio

import android.Manifest
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
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.smoothstreaming.SsMediaSource
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
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
class AudioModule : Module(), LifecycleEventListener {
  private val activity: Activity
    get() = appContext.activityProvider?.currentActivity ?: throw Exceptions.MissingActivity()
  private lateinit var audioManager: AudioManager
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val players = mutableMapOf<String, AudioPlayer>()
  private var appIsPaused = false
  private var staysActiveInBackground = false
  private var audioEnabled = true
  private var audioInterruptionMode = AudioInterruptionMode.DUCK_OTHERS
  private var shouldRouteThroughEarpiece = false

  private enum class AudioInterruptionMode {
    DO_NOT_MIX,
    DUCK_OTHERS
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val uiManager = appContext.legacyModule<UIManager>()
      uiManager?.registerLifecycleEventListener(this@AudioModule)
    }

    AsyncFunction("setAudioModeAsync") { mode: AudioMode ->
      staysActiveInBackground = mode.shouldPlayInBackground
      shouldRouteThroughEarpiece = mode.shouldRouteThroughEarpiece ?: false
      if (shouldRouteThroughEarpiece) {
        updatePlaySoundThroughEarpiece(true)
      }
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

    OnDestroy {
      val uiManager = appContext.legacyModule<UIManager>()
      uiManager?.unregisterLifecycleEventListener(this@AudioModule)
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

        val mediaSource = buildMediaSourceFactory(factory, MediaItem.fromUri(source.uri))
        runBlocking(appContext.mainQueue.coroutineContext) {
          val player = AudioPlayer(
            context,
            appContext,
            mediaSource
          )
          players[player.id] = player
          player
        }
      }

      Property("id") { ref ->
        ref.id
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

      Property("playing") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.isPlaying
        }
      }

      Property("mute") { ref ->
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
        if (!audioEnabled) {
          Log.e(TAG, "Could not convert string to JSONObject")
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
          // TODO: Log a warning?
        }
      }

      Function("stop") { ref: AudioRecorder ->
        checkRecordingPermission()
        ref.stopRecording()
      }

      Function("getStatus") { ref: AudioRecorder ->
        checkRecordingPermission()
        ref.getAudioRecorderStatus()
      }

      AsyncFunction("getCurrentInput") { ref: AudioRecorder ->
        getCurrentInput(ref)
      }

      Function("getAvailableInputs") {
        return@Function getAvailableInputs()
      }

      Function("setInput") { ref: AudioRecorder, input: String ->
        setInput(input, ref)
      }
    }
  }

  private fun setInput(uid: String, ref: AudioRecorder) {
    val deviceInfo: AudioDeviceInfo? = getDeviceInfoFromUid(uid)

    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
      throw SetAudioInputNotSupportedException()
    }

    if (deviceInfo != null && deviceInfo.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        audioManager.setCommunicationDevice(deviceInfo)
      } else {
        audioManager.startBluetoothSco()
      }
    } else {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        audioManager.clearCommunicationDevice()
      } else {
        audioManager.stopBluetoothSco()
      }
    }

    val success = ref.recorder.setPreferredDevice(deviceInfo)
    if (!success) {
      throw PreferredInputNotFoundException()
    }
  }

  private fun updatePlaySoundThroughEarpiece(playThroughEarpiece: Boolean) {
    audioManager.setMode(if (playThroughEarpiece) AudioManager.MODE_IN_COMMUNICATION else AudioManager.MODE_NORMAL)
    audioManager.setSpeakerphoneOn(!playThroughEarpiece)
  }

  private fun getDeviceInfoFromUid(uid: String): AudioDeviceInfo? {
    val id = uid.toInt()
    val audioDevices: Array<AudioDeviceInfo> = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
    for (device in audioDevices) {
      val deviceId = device.id
      if (deviceId == id) {
        return device
      }
    }
    return null
  }

  private fun getCurrentInput(ref: AudioRecorder): Bundle {
    var deviceInfo: AudioDeviceInfo? = null

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
      throw GetAudioInputNotSupportedException()
    }

    try {
      // getRoutedDevice() is the most reliable way to return the actual mic input, however it
      // only returns a valid device when actively recording, and may throw otherwise.
      // https://developer.android.com/reference/android/media/MediaRecorder#getRoutedDevice()
      deviceInfo = ref.recorder.getRoutedDevice()
    } catch (e: java.lang.Exception) {
      // no-op
    }

    // If no routed device is found try preferred device
    if (deviceInfo == null) {
      deviceInfo = ref.recorder.preferredDevice
    }

    if (deviceInfo == null) {
      // If no preferred device is found, set it to the first built-in input we can find
      val audioDevices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
      for (availableDeviceInfo in audioDevices) {
        val type = availableDeviceInfo.type
        if (type == AudioDeviceInfo.TYPE_BUILTIN_MIC) {
          deviceInfo = availableDeviceInfo
          ref.recorder.setPreferredDevice(deviceInfo)
          break
        }
      }
    }

    if (deviceInfo == null) {
      throw DeviceInfoNotFoundException()
    }

    return getMapFromDeviceInfo(deviceInfo)
  }

  private fun getAvailableInputs() = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS).mapNotNull { deviceInfo ->
    val type = deviceInfo.type
    if (type == AudioDeviceInfo.TYPE_BUILTIN_MIC || type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || type == AudioDeviceInfo.TYPE_WIRED_HEADSET) {
      getMapFromDeviceInfo(deviceInfo)
    } else {
      null
    }
  }

  private fun retrieveStreamType(uri: Uri): Int = Util.inferContentType(uri)

  private fun buildMediaSourceFactory(
    factory: DataSource.Factory,
    mediaItem: MediaItem
  ): MediaSource {
    val uri = mediaItem.localConfiguration?.uri
    var newUri = uri
    try {
      if (uri?.scheme == null) {
        val resourceId: Int = context.resources?.getIdentifier(uri.toString(), "raw", context.packageName)
          ?: 0
        newUri = Uri.Builder().scheme(ContentResolver.SCHEME_ANDROID_RESOURCE).path(resourceId.toString()).build()
      }
    } catch (e: Exception) {
      Log.e("AudioModule", "Error reading raw resource from ExoPlayer", e)
    }
    val source = when (val type = retrieveStreamType(newUri!!)) {
      CONTENT_TYPE_SS -> SsMediaSource.Factory(factory)
      CONTENT_TYPE_DASH -> DashMediaSource.Factory(factory)
      CONTENT_TYPE_HLS -> HlsMediaSource.Factory(factory)
      CONTENT_TYPE_OTHER -> ProgressiveMediaSource.Factory(factory)
      else -> throw IllegalStateException("Unsupported type: $type")
    }
    return source.createMediaSource(mediaItem)
  }

  private fun checkRecordingPermission() {
    val permission = ContextCompat.checkSelfPermission(activity.applicationContext, Manifest.permission.RECORD_AUDIO)
    if (permission != PackageManager.PERMISSION_GRANTED) {
      throw AudioPermissionsException()
    }
  }

  private fun getMapFromDeviceInfo(deviceInfo: AudioDeviceInfo): Bundle {
    val map = Bundle()
    val type = when (deviceInfo.type) {
      AudioDeviceInfo.TYPE_BUILTIN_MIC -> "MicrophoneBuiltIn"
      AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "BluetoothSCO"
      AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> "BluetoothA2DP"
      AudioDeviceInfo.TYPE_TELEPHONY -> "Telephony"
      AudioDeviceInfo.TYPE_WIRED_HEADSET -> "MicrophoneWired"
      else -> "Unknown device type"
    }
    map.putString("name", deviceInfo.getProductName().toString())
    map.putString("type", type)
    map.putString("uid", deviceInfo.id.toString())
    return map
  }

  override fun onHostResume() {
    if (appIsPaused) {
      appIsPaused = false
      if (!staysActiveInBackground) {
        for (player in players.values) {
          if (player.isPaused) {
            player.isPaused = false
            player.ref.play()
          }
        }
        if (shouldRouteThroughEarpiece) {
          updatePlaySoundThroughEarpiece(true)
        }
      }
    }
  }

  override fun onHostPause() {
    if (!appIsPaused) {
      appIsPaused = true
      if (!staysActiveInBackground) {
        for (player in players.values) {
          if (player.player.isPlaying) {
            player.isPaused = true
            player.ref.pause()
          }
        }
      }
    }
  }

  override fun onHostDestroy() {
    for (player in players.values) {
      player.player.stop()
      player.deallocate()
    }
  }

  companion object {
    val TAG: String = AudioModule::class.java.simpleName
  }
}
