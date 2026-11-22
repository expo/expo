package expo.modules.audio

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.MediaRecorder
import android.media.MediaRecorder.MEDIA_ERROR_SERVER_DIED
import android.media.MediaRecorder.MEDIA_RECORDER_ERROR_UNKNOWN
import android.media.MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED
import android.os.Build
import androidx.core.content.ContextCompat
import android.net.Uri
import androidx.core.net.toUri
import expo.modules.audio.service.AudioRecordingServiceConnection
import expo.modules.kotlin.exception.CodedException
import expo.modules.v2.legacyAppContext
import expo.modules.v2.legacyAppContextOrNull
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.SharedObject
import io.github.expo.modules.v2.module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import java.io.IOException
import java.lang.ref.WeakReference
import java.util.UUID
import kotlin.math.log10

@ExpoSharedObject
class AudioRecorder @JS constructor(
  private val options: RecordingOptions
) : SharedObject(),
  MediaRecorder.OnErrorListener,
  MediaRecorder.OnInfoListener {
  var filePath: String? = null
  private var meteringEnabled = options.isMeteringEnabled
  private var durationAlreadyRecorded = 0L
  var isPrepared = false

  private var recorder: MediaRecorder? = null

  @JS
  val id = UUID.randomUUID().toString()
  var startTime = 0L
  var isRecording = false
  var isPaused = false
  private var isPausedBySystem = false
  private var recordingTimerJob: Job? = null
  private var durationLimitMillis: Long? = null
  var useForegroundService = false

  private val serviceConnectionDelegate = lazy { AudioRecordingServiceConnection(WeakReference(this), legacyAppContext) }
  val serviceConnection by serviceConnectionDelegate

  private val module: AudioModule
    get() = context.module<AudioModule>() ?: throw AudioModuleNotFoundException()

  @Event(name = "recordingStatusUpdate")
  private val onRecordingStatusUpdate = event<Map<String, Any?>>()

  init {
    contextOrNull?.module<AudioModule>()?.registerRecorder(this)
  }

  @JS("uri")
  val uriFromJS: String
    get() = filePath?.let { Uri.fromFile(File(it)).toString() } ?: ""

  @JS("isRecording")
  val isRecordingFromJS: Boolean
    get() = isRecording

  @JS("currentTime")
  val currentTimeFromJS: Double
    get() = getCurrentTimeSeconds()

  @JS("prepareToRecordAsync")
  suspend fun prepareToRecordAsyncFromJS(options: RecordingOptions?): Unit = module.background {
    module.checkRecordingPermission()
    prepareRecording(options)
  }

  @JS("record")
  fun recordFromJS(options: RecordOptions?) {
    module.checkRecordingPermission()
    if (isPrepared) {
      recordWithOptions(options?.atTime, options?.forDuration)
    }
  }

  @JS("recordForDuration")
  fun recordForDurationFromJS(seconds: Double) {
    module.checkRecordingPermission()
    if (isPrepared) {
      recordForDuration(seconds)
    }
  }

  @JS("pause")
  fun pauseFromJS() {
    module.checkRecordingPermission()
    pauseRecording()
  }

  @JS("stop")
  suspend fun stopFromJS(): Map<String, Any?> = module.background {
    module.checkRecordingPermission()
    stopRecording()
  }

  @JS("getStatus")
  fun getStatusFromJS(): Map<String, Any?> = getAudioRecorderStatus()

  @JS("getCurrentInput")
  suspend fun getCurrentInputFromJS(): Map<String, Any?> = module.background {
    getCurrentInput(module.audioManager)
  }

  @JS("getAvailableInputs")
  fun getAvailableInputsFromJS(): List<Map<String, Any?>> = getAvailableInputs(module.audioManager)

  @JS("setInput")
  fun setInputFromJS(input: String) {
    setInput(input, module.audioManager)
  }

  @JS("startRecordingAtTime")
  fun startRecordingAtTimeFromJS(seconds: Double) {
    module.checkRecordingPermission()
    if (isPrepared) {
      startRecordingAtTime(seconds)
    }
  }

  private fun currentFileUrl(): String? =
    filePath?.let(::File)?.toUri()?.toString()

  val fileSize: Long
    get() = filePath?.let { File(it).length() } ?: 0L

  private fun getAudioRecorderLevels(): Double? {
    if (!meteringEnabled || recorder == null || !isRecording) {
      return null
    }

    val amplitude: Int = try {
      recorder?.maxAmplitude ?: 0
    } catch (_: Exception) {
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
    isPausedBySystem = false
    if (useForegroundService) {
      serviceConnection.recordingServiceBinder?.service?.registerRecorder(this) ?: run {
        throw AudioRecordingServiceException("The service connection is not bound, but `allowsBackgroundRecording` is set to `true`")
      }
    }

    if (isPaused && durationLimitMillis?.let { durationAlreadyRecorded >= it } == true) {
      stopRecording()
      return
    }

    if (isPaused) {
      recorder?.resume()
    } else {
      recorder?.start()
    }
    startTime = System.currentTimeMillis()
    isRecording = true
    isPaused = false
    scheduleRecordingStop()
  }

  fun recordWithOptions(atTimeSeconds: Double? = null, forDurationSeconds: Double? = null) {
    recordingTimerJob?.cancel()
    recordingTimerJob = null

    // Note: atTime is not supported on Android (no native equivalent), so we ignore it entirely
    // Only forDuration is implemented using coroutines
    if (forDurationSeconds != null) {
      durationLimitMillis = (forDurationSeconds * 1000).toLong()
    } else if (!isPaused || atTimeSeconds != null) {
      // A bare record() resumes the current capture and keeps its limit.
      durationLimitMillis = null
    }

    record()
  }

  // Keep backward compatibility methods
  fun recordForDuration(seconds: Double) {
    recordWithOptions(forDurationSeconds = seconds)
  }

  fun startRecordingAtTime(seconds: Double) {
    recordWithOptions(atTimeSeconds = seconds)
  }

  fun pauseRecording() {
    isPausedBySystem = false
    recordingTimerJob?.cancel()
    recordingTimerJob = null
    recorder?.pause()
    durationAlreadyRecorded = getAudioRecorderDurationMillis()
    isRecording = false
    isPaused = true
  }

  fun pauseForSystem() {
    if (isRecording) {
      pauseRecording()
      isPausedBySystem = true
    }
  }

  fun resumeAfterSystemPause() {
    if (isPausedBySystem && isPaused) {
      record()
    }
  }

  private fun scheduleRecordingStop() {
    recordingTimerJob?.cancel()
    recordingTimerJob = durationLimitMillis?.let { limit ->
      legacyAppContextOrNull?.mainQueue?.launch {
        delay((limit - getAudioRecorderDurationMillis()).coerceAtLeast(0))
        if (isRecording) {
          stopRecording()
        }
      }
    }
  }

  fun stopRecording(): Map<String, Any?> {
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

    val status = buildMap {
      put("canRecord", false)
      put("isRecording", false)
      put("durationMillis", durationMillis)
      if (!stopFailed) {
        url?.let { put("url", it) }
      }
    }

    // Emit completion event on the main thread
    legacyAppContextOrNull?.mainQueue?.launch {
      onRecordingStatusUpdate(
        mapOf(
          "id" to id,
          "isFinished" to true,
          "hasError" to stopFailed,
          "error" to stopError,
          "url" to if (stopFailed) {
            null
          } else {
            url
          }
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
    durationLimitMillis = null
    startTime = 0L
    isPrepared = false
  }

  @Suppress("DEPRECATION")
  private fun createRecorder(options: RecordingOptions): MediaRecorder {
    val outputFilePath = createRecordingFilePath(options)
    val mediaRecorder = MediaRecorder()

    try {
      setRecordingOptions(mediaRecorder, options, outputFilePath)
    } catch (e: Exception) {
      mediaRecorder.release()
      throw e
    }

    return mediaRecorder
  }

  private fun createRecordingFilePath(options: RecordingOptions): String {
    val provided = options.fileName?.takeIf { it.isNotEmpty() }
    if (provided != null && (provided.contains('/') || provided.contains('\\') || provided.contains(".."))) {
      throw InvalidRecordingFileNameException(provided)
    }
    val baseName = provided ?: "recording-${UUID.randomUUID()}"
    val filename = "$baseName${options.extension}"
    val parentDirectory = when (options.directory ?: RecordingDirectory.CACHE) {
      RecordingDirectory.CACHE -> legacyAppContext.cacheDirectory
      RecordingDirectory.DOCUMENT -> legacyAppContext.persistentFilesDirectory
    }
    val directory = File(parentDirectory, "Audio")
    try {
      ensureDirExists(directory)
    } catch (_: IOException) {
      // This only occurs in the case that the scoped path is not in this experience's scope,
      // which is never true.
    }
    return File(directory, filename).absolutePath
  }

  private fun setRecordingOptions(recorder: MediaRecorder, options: RecordingOptions, outputFilePath: String) {
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

      filePath = outputFilePath
      setOnErrorListener(this@AudioRecorder)
      setOnInfoListener(this@AudioRecorder)
      setOutputFile(outputFilePath)
      isPrepared = false
    }
  }

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()

    if (serviceConnectionDelegate.isInitialized()) {
      serviceConnection.release()

      if (useForegroundService) {
        serviceConnection.recordingServiceBinder?.service?.unregisterRecorder(this)
        serviceConnection.unbind()
        serviceConnection.cleanup()
      }
    }
    reset()
  }

  fun getAudioRecorderStatus(): Map<String, Any?> = if (hasRecordingPermissions()) {
    buildMap {
      put("canRecord", isPrepared)
      put("isRecording", isRecording)
      put("durationMillis", getAudioRecorderDurationMillis())
      put("fileSize", fileSize)
      getAudioRecorderLevels()?.let {
        put("metering", it)
      }
      currentFileUrl()?.let { put("url", it) }
    }
  } else {
    mapOf(
      "canRecord" to false,
      "isRecording" to false,
      "durationMillis" to 0L,
      "fileSize" to 0L,
      "url" to null
    )
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
    onRecordingStatusUpdate(
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
        onRecordingStatusUpdate(
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

  fun getCurrentInput(audioManager: AudioManager): Map<String, Any?> {
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
      } catch (_: java.lang.Exception) {
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
    ContextCompat.checkSelfPermission(androidContext, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

  fun getAvailableInputs(audioManager: AudioManager) =
    audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS).mapNotNull { deviceInfo ->
      val type = deviceInfo.type
      if (
        type == AudioDeviceInfo.TYPE_BUILTIN_MIC ||
        type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
        type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
        type == AudioDeviceInfo.TYPE_USB_DEVICE ||
        type == AudioDeviceInfo.TYPE_USB_HEADSET
      ) {
        getMapFromDeviceInfo(deviceInfo)
      } else {
        null
      }
    }

  @Suppress("DEPRECATION")
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
