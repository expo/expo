package expo.modules.audio

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.MediaRecorder
import android.media.MediaRecorder.MEDIA_ERROR_SERVER_DIED
import android.media.MediaRecorder.MEDIA_RECORDER_ERROR_UNKNOWN
import android.media.MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.io.IOException
import java.util.UUID
import kotlin.math.ln

private const val RECORDING_STATUS_UPDATE = "recordingStatusUpdate"

class AudioRecorder(
  private val context: Context,
  appContext: AppContext,
  private val options: RecordingOptions
) : SharedObject(appContext),
  MediaRecorder.OnErrorListener,
  MediaRecorder.OnInfoListener {
  private var filePath: String? = null
  private var meteringEnabled = false
  private var durationAlreadyRecorded = 0L
  private var isPrepared = false
  private var shouldCreateRecorder = false

  var recorder = createRecorder(options)
  val id = UUID.randomUUID().toString()
  var uri: String? = null
  var uptime = 0L
  var isRecording = false
  var isPaused = false

  private fun getAudioRecorderLevels(): Int {
    if (!meteringEnabled) {
      return -160
    }
    val amplitude: Int = recorder.maxAmplitude
    return if (amplitude == 0) {
      -160
    } else {
      (20 * ln(amplitude.toDouble() / 32767.0)).toInt()
    }
  }

  fun prepareRecording(options: RecordingOptions?) {
    if (options != null && !shouldCreateRecorder) {
      // New options have been passed in so we rebuild the recorder
      shouldCreateRecorder = this.options != options
    }
    if (shouldCreateRecorder) {
      recorder = options?.let { createRecorder(it) } ?: createRecorder(this.options)
    }
    recorder.prepare()
    isPrepared = true
  }

  fun record() {
    if (isPaused) {
      recorder.resume()
    } else {
      recorder.start()
    }
    isRecording = true
    isPaused = false
    uptime = SystemClock.uptimeMillis()
  }

  fun pauseRecording() {
    recorder.pause()
    durationAlreadyRecorded = getAudioRecorderDurationMillis()
    isRecording = false
    isPaused = true
  }

  fun stopRecording(): Bundle {
    recorder.stop()
    reset()
    return getAudioRecorderStatus()
  }

  private fun reset() {
    isRecording = false
    isPaused = false
    durationAlreadyRecorded = 0
    shouldCreateRecorder = true
    isPrepared = false
  }

  private fun createRecorder(options: RecordingOptions) =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      MediaRecorder(context)
    } else {
      MediaRecorder()
    }.apply {
      setRecordingOptions(this, options)
    }

  private fun setRecordingOptions(recorder: MediaRecorder, options: RecordingOptions) {
    with(recorder) {
      setAudioSource(MediaRecorder.AudioSource.DEFAULT)
      if (options.outputFormat != null) {
        setOutputFormat(options.outputFormat.toMediaOutputFormat())
      } else {
        setOutputFormat(MediaRecorder.OutputFormat.DEFAULT)
      }
      if (options.audioEncoder != null) {
        setAudioEncoder(options.audioEncoder.toMediaEncoding())
      } else {
        setAudioEncoder(MediaRecorder.AudioEncoder.DEFAULT)
      }
      options.sampleRate?.let {
        setAudioSamplingRate(it.toInt())
      }
      options.numberOfChannels?.let {
        setAudioChannels(it.toInt())
      }
      options.bitRate?.let {
        setAudioEncodingBitRate(it.toInt())
      }
      options.maxFileSize?.let {
        setMaxFileSize(it.toLong())
      }

      val filename = "recording-${UUID.randomUUID()}${options.extension}"
      try {
        val directory = File(context.cacheDir.toString() + File.separator + "Audio")
        ensureDirExists(directory)
        filePath = "$directory${File.separator}$filename"
      } catch (e: IOException) {
        // This only occurs in the case that the scoped path is not in this experience's scope,
        // which is never true.
      }
      setOnErrorListener(this@AudioRecorder)
      setOnInfoListener(this@AudioRecorder)
      setOutputFile(filePath)
      uri = filePath
      isPrepared = false
    }
  }

  override fun deallocate() {
    recorder.release()
  }

  fun getAudioRecorderStatus() = Bundle().apply {
    putBoolean("canRecord", isPrepared)
    putBoolean("isRecording", isRecording)
    putLong("durationMillis", getAudioRecorderDurationMillis())
    if (meteringEnabled) {
      putInt("metering", getAudioRecorderLevels())
    }
    putString("url", uri)
  }

  private fun getAudioRecorderDurationMillis(): Long {
    var duration = durationAlreadyRecorded
    if (isRecording && uptime > 0) {
      duration += SystemClock.uptimeMillis() - uptime
    }
    return duration
  }

  override fun onError(mr: MediaRecorder?, what: Int, extra: Int) {
    val error = when (what) {
      MEDIA_RECORDER_ERROR_UNKNOWN -> "An unknown recording error occurred"
      MEDIA_ERROR_SERVER_DIED -> "The media server has crashed"
      else -> "An unknown recording error occurred"
    }
    emit(
      RECORDING_STATUS_UPDATE,
      mapOf(
        "isFinished" to true,
        "hasError" to true,
        "error" to error,
        "url" to null
      )
    )
  }

  override fun onInfo(mr: MediaRecorder?, what: Int, extra: Int) {
    when (what) {
      MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED -> {
        recorder.stop()
        emit(
          "onRecordingStatusUpdate",
          mapOf(
            "isFinished" to true,
            "hasError" to true,
            "error" to null,
            "url" to Uri.fromFile(filePath?.let { File(it) }).toString()
          )
        )
      }
    }
  }

  fun getCurrentInput(audioManager: AudioManager): Bundle {
    var deviceInfo: AudioDeviceInfo? = null

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
      throw GetAudioInputNotSupportedException()
    }

    try {
      // getRoutedDevice() is the most reliable way to return the actual mic input, however it
      // only returns a valid device when actively recording, and may throw otherwise.
      // https://developer.android.com/reference/android/media/MediaRecorder#getRoutedDevice()
      deviceInfo = recorder.getRoutedDevice()
    } catch (e: java.lang.Exception) {
      // no-op
    }

    // If no routed device is found try preferred device
    if (deviceInfo == null) {
      deviceInfo = recorder.preferredDevice
    }

    if (deviceInfo == null) {
      // If no preferred device is found, set it to the first built-in input we can find
      val audioDevices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
      for (availableDeviceInfo in audioDevices) {
        val type = availableDeviceInfo.type
        if (type == AudioDeviceInfo.TYPE_BUILTIN_MIC) {
          deviceInfo = availableDeviceInfo
          recorder.setPreferredDevice(deviceInfo)
          break
        }
      }
    }

    if (deviceInfo == null) {
      throw DeviceInfoNotFoundException()
    }

    return getMapFromDeviceInfo(deviceInfo)
  }

  fun getAvailableInputs(audioManager: AudioManager) =
    audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS).mapNotNull { deviceInfo ->
      val type = deviceInfo.type
      if (type == AudioDeviceInfo.TYPE_BUILTIN_MIC || type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || type == AudioDeviceInfo.TYPE_WIRED_HEADSET) {
        getMapFromDeviceInfo(deviceInfo)
      } else {
        null
      }
    }

  fun setInput(uid: String, audioManager: AudioManager) {
    val deviceInfo: AudioDeviceInfo? = getDeviceInfoFromUid(uid, audioManager)

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

    val success = recorder.setPreferredDevice(deviceInfo)
    if (!success) {
      throw PreferredInputNotFoundException()
    }
  }

  private fun getDeviceInfoFromUid(uid: String, audioManager: AudioManager): AudioDeviceInfo? {
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
}
