package expo.modules.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.MediaRecorder
import android.media.MediaRecorder.MEDIA_ERROR_SERVER_DIED
import android.media.MediaRecorder.MEDIA_RECORDER_ERROR_UNKNOWN
import android.media.MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.core.content.ContextCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.io.IOException
import java.util.UUID
import kotlin.math.log10

private const val RECORDING_STATUS_UPDATE = "recordingStatusUpdate"

class AudioRecorder(
  private val context: Context,
  appContext: AppContext,
  private val options: RecordingOptions
) : SharedObject(appContext),
  MediaRecorder.OnErrorListener,
  MediaRecorder.OnInfoListener {
  var filePath: String? = null
  private var meteringEnabled = options.isMeteringEnabled
  private var durationAlreadyRecorded = 0L
  var isPrepared = false

  private var recorder: MediaRecorder? = null
  val id = UUID.randomUUID().toString()
  var startTime = 0L
  var isRecording = false
  var isPaused = false

  private fun getAudioRecorderLevels(): Double? {
    if (!meteringEnabled || recorder == null || !isRecording) {
      return null
    }

    val amplitude: Int = recorder?.maxAmplitude ?: 0
    return if (amplitude == 0) {
      -160.0
    } else {
      20 * log10(amplitude.toDouble() / 32767.0)
    }
  }

  fun prepareRecording(options: RecordingOptions?) {
    recorder = options?.let { createRecorder(it) } ?: createRecorder(this.options)
    try {
      recorder?.prepare()
      isPrepared = true
    } catch (_: Exception) {
      recorder?.release()
      recorder = null
      isPrepared = false
    }
  }

  fun record() {
    if (isPaused) {
      recorder?.resume()
    } else {
      recorder?.start()
    }
    startTime = System.currentTimeMillis()
    isRecording = true
    isPaused = false
  }

  fun pauseRecording() {
    recorder?.pause()
    durationAlreadyRecorded = getAudioRecorderDurationMillis()
    isRecording = false
    isPaused = true
  }

  fun stopRecording(): Bundle {
    try {
      recorder?.stop()
    } finally {
      reset()
    }
    return getAudioRecorderStatus()
  }

  private fun reset() {
    recorder?.release()
    recorder = null
    isRecording = false
    isPaused = false
    durationAlreadyRecorded = 0
    startTime = 0L
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
    if (!hasRecordingPermissions()) {
      return
    }
    with(recorder) {
      setAudioSource(MediaRecorder.AudioSource.MIC)
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
        val directory = File(context.cacheDir, "Audio")
        ensureDirExists(directory)
        val file = File(directory, filename)
        filePath = file.absolutePath
      } catch (e: IOException) {
        // This only occurs in the case that the scoped path is not in this experience's scope,
        // which is never true.
      }
      setOnErrorListener(this@AudioRecorder)
      setOnInfoListener(this@AudioRecorder)
      setOutputFile(filePath)
      isPrepared = false
    }
  }

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    reset()
  }

  fun getAudioRecorderStatus() = if (hasRecordingPermissions()) {
    Bundle().apply {
      putBoolean("canRecord", isPrepared)
      putBoolean("isRecording", isRecording)
      putLong("durationMillis", getAudioRecorderDurationMillis())
      getAudioRecorderLevels()?.let {
        putDouble("metering", it)
      }
      filePath?.let {
        val path = Uri.fromFile(File(it)).toString()
        putString("url", path)
      }
    }
  } else {
    Bundle().apply {
      putBoolean("canRecord", false)
      putBoolean("isRecording", false)
      putLong("durationMillis", 0)
      putString("url", null)
    }
  }

  private fun getAudioRecorderDurationMillis(): Long {
    var duration = durationAlreadyRecorded
    if (isRecording) {
      duration += System.currentTimeMillis() - startTime
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
        recorder?.stop()
        emit(
          RECORDING_STATUS_UPDATE,
          mapOf(
            "isFinished" to true,
            "hasError" to true,
            "error" to null,
            "url" to Uri.parse(filePath).toString()
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
      deviceInfo = recorder?.routedDevice
    } catch (e: java.lang.Exception) {
      // no-op
    }

    // If no routed device is found try preferred device
    if (deviceInfo == null) {
      deviceInfo = recorder?.preferredDevice
    }

    if (deviceInfo == null) {
      // If no preferred device is found, set it to the first built-in input we can find
      val audioDevices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
      for (availableDeviceInfo in audioDevices) {
        val type = availableDeviceInfo.type
        if (type == AudioDeviceInfo.TYPE_BUILTIN_MIC) {
          deviceInfo = availableDeviceInfo
          recorder?.setPreferredDevice(deviceInfo)
          break
        }
      }
    }

    if (deviceInfo == null) {
      throw DeviceInfoNotFoundException()
    }

    return getMapFromDeviceInfo(deviceInfo)
  }

  private fun hasRecordingPermissions() =
    ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

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

    val success = recorder?.setPreferredDevice(deviceInfo)
    if (success == false) {
      throw PreferredInputNotFoundException()
    }
  }

  private fun getDeviceInfoFromUid(uid: String, audioManager: AudioManager): AudioDeviceInfo? {
    val id = uid.toInt()
    val audioDevices: Array<AudioDeviceInfo> = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
    for (device in audioDevices) {
      if (device.id == id) {
        return device
      }
    }
    return null
  }
}
