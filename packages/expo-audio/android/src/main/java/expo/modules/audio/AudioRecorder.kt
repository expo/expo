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
import android.os.Build
import android.os.Bundle
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import expo.modules.audio.service.AudioRecordingServiceConnection
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import java.io.IOException
import java.lang.ref.WeakReference
import java.util.UUID
import kotlin.coroutines.Continuation
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
  private var recordingTimerJob: Job? = null
  var useForegroundService = false
  private var bindingContinuation: Continuation<Boolean>? = null

  val serviceConnection = AudioRecordingServiceConnection(WeakReference(this), appContext)

  private val _appContext: AppContext
    get() {
      return appContext ?: throw Exceptions.AppContextLost()
    }

  private fun currentFileUrl(): String? =
    filePath?.let(::File)?.toUri()?.toString()

  private fun getAudioRecorderLevels(): Double? {
    if (!meteringEnabled || recorder == null || !isRecording) {
      return null
    }

    val amplitude: Int = try {
      recorder?.maxAmplitude ?: 0
    } catch (e: Exception) {
      // MediaRecorder maxAmplitude can throw various exceptions:
      // - IllegalStateException: invalid recorder state/race condition
      // - RuntimeException: getMaxAmplitude failed (hardware/driver issues)
      // We return 0 (silence) as fallback for any amplitude reading failure
      0
    }
    return if (amplitude == 0) {
      -160.0
    } else {
      20 * log10(amplitude.toDouble() / 32767.0)
    }
  }

  suspend fun prepareRecording(options: RecordingOptions?) {
    if (recorder != null || isPrepared || isRecording || isPaused) {
      throw AudioRecorderAlreadyPreparedException()
    }
    val recordingOptions = options ?: this.options
    val mediaRecorder = createRecorder(recordingOptions)
    recorder = mediaRecorder

    try {
      if (useForegroundService) {
        serviceConnection.bindWithService()
      }
      mediaRecorder.prepare()
      isPrepared = true
    } catch (e: Exception) {
      mediaRecorder.release()
      recorder = null
      isPrepared = false

      throw e as? CodedException ?: AudioRecorderPrepareException(e)
    }
  }

  fun record() {
    if (useForegroundService) {
      serviceConnection.recordingServiceBinder?.service?.registerRecorder(this) ?: run {
        throw AudioRecordingServiceException("The service connection is not bound, but `allowsBackgroundRecording` is set to `true`")
      }
    }

    if (isPaused) {
      recorder?.resume()
    } else {
      recorder?.start()
    }
    startTime = System.currentTimeMillis()
    isRecording = true
    isPaused = false
  }

  fun recordWithOptions(atTimeSeconds: Double? = null, forDurationSeconds: Double? = null) {
    recordingTimerJob?.cancel()

    // Note: atTime is not supported on Android (no native equivalent), so we ignore it entirely
    // Only forDuration is implemented using coroutines

    forDurationSeconds?.let {
      record()
      recordingTimerJob = appContext?.mainQueue?.launch {
        delay((it * 1000).toLong())
        // Stop recording regardless of current state
        // This matches the iOS behaviour where the timer continues regardless of if
        // the recording was paused.
        if (isRecording || isPaused) {
          stopRecording()
        }
      }
    } ?: record()
  }

  // Keep backward compatibility methods
  fun recordForDuration(seconds: Double) {
    recordWithOptions(forDurationSeconds = seconds)
  }

  fun startRecordingAtTime(seconds: Double) {
    recordWithOptions(atTimeSeconds = seconds)
  }

  fun pauseRecording() {
    recorder?.pause()
    durationAlreadyRecorded = getAudioRecorderDurationMillis()
    isRecording = false
    isPaused = true
  }

  fun stopRecording(): Bundle {
    val url = currentFileUrl()
    var durationMillis: Long
    var stopFailed = false
    var stopError: String? = null

    if (useForegroundService) {
      serviceConnection.recordingServiceBinder?.service?.unregisterRecorder(this)
    }

    try {
      recorder?.stop()
      durationMillis = getAudioRecorderDurationMillis()
    } catch (e: RuntimeException) {
      stopFailed = true
      stopError = e.localizedMessage ?: "Failed to stop recording"
      durationMillis = getAudioRecorderDurationMillis()
    } finally {
      reset()
    }

    val status = Bundle().apply {
      putBoolean("canRecord", false)
      putBoolean("isRecording", false)
      putLong("durationMillis", durationMillis)
      if (!stopFailed) {
        url?.let { putString("url", it) }
      }
    }

    // Emit completion event on the main thread
    appContext?.mainQueue?.launch {
      emit(
        RECORDING_STATUS_UPDATE,
        mapOf(
          "id" to id,
          "isFinished" to true,
          "hasError" to stopFailed,
          "error" to stopError,
          "url" to if (stopFailed) null else url
        )
      )
    }

    return status
  }

  private fun reset() {
    recordingTimerJob?.cancel()
    recordingTimerJob = null

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
      setAudioSource(options.audioSource?.toAudioSource() ?: MediaRecorder.AudioSource.MIC)
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

    // Mark recorder as released
    serviceConnection.release()

    if (useForegroundService) {
      serviceConnection.recordingServiceBinder?.service?.unregisterRecorder(this)
      // Unbind service connection
      serviceConnection.unbind()
      // Clean up service connection resources
      serviceConnection.cleanup()
    }
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
      currentFileUrl()?.let { putString("url", it) }
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

  fun getCurrentTimeSeconds(): Double {
    return getAudioRecorderDurationMillis() / 1000.0
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
        val url = currentFileUrl()

        if (useForegroundService) {
          serviceConnection.recordingServiceBinder?.service?.unregisterRecorder(this)
          // Unbind the service connection
          serviceConnection.unbind()
        }

        try {
          recorder?.stop()
        } catch (_: RuntimeException) {
          // Ignore stop errors
        } finally {
          reset()
        }
        emit(
          RECORDING_STATUS_UPDATE,
          mapOf(
            "isFinished" to true,
            "hasError" to true,
            "error" to null,
            "url" to url
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

    if (isRecording) {
      try {
        // getRoutedDevice() is the most reliable way to return the actual mic input, however it
        // only returns a valid device when actively recording, and may throw otherwise.
        // https://developer.android.com/reference/android/media/MediaRecorder#getRoutedDevice()
        deviceInfo = recorder?.routedDevice
      } catch (e: java.lang.Exception) {
        // no-op
      }
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
          recorder?.preferredDevice = deviceInfo
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
