package expo.modules.audio

import android.Manifest
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.annotation.RequiresPermission
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.NativeArrayBuffer
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.nio.ByteBuffer
import java.nio.ByteOrder

internal const val AUDIO_STREAM_BUFFER = "audioStreamBuffer"
internal const val AUDIO_STREAM_STATUS = "audioStreamStatus"
private const val DEFAULT_BUFFER_DURATION_MS = 100
private val FALLBACK_SAMPLE_RATES = intArrayOf(48000, 44100, 16000, 22050, 8000)

private data class ResolvedAudioConfig(
  val sampleRate: Int,
  val channelCount: Int,
  val channelConfig: Int,
  val audioEncoding: Int,
  val bytesPerSample: Int,
  val bufferSize: Int,
  val readSize: Int
)

class AudioStream(
  appContext: AppContext,
  private val options: AudioStreamOptions
) : SharedObject(appContext) {

  val id: String = java.util.UUID.randomUUID().toString()

  private var audioRecord: AudioRecord? = null
  private var captureJob: Job? = null
  private val coroutineScope = CoroutineScope(Dispatchers.IO)

  var sampleRate: Int = 0
    private set
  var channels: Int = 0
    private set
  var isStreaming: Boolean = false
    private set

  private var startTimeNanos: Long = 0

  @RequiresPermission(Manifest.permission.RECORD_AUDIO)
  fun start() {
    if (isStreaming) {
      return
    }

    val config = resolveAudioConfig()
    val recorder = createAudioRecord(config)

    try {
      recorder.startRecording()
    } catch (e: IllegalStateException) {
      recorder.release()
      throw AudioStreamInitializationException(
        "Failed to start the audio stream. The microphone is likely held by another app or by the system"
      )
    }

    sampleRate = config.sampleRate
    channels = config.channelCount
    audioRecord = recorder
    startTimeNanos = System.nanoTime()
    isStreaming = true
    emitStatus()

    startCaptureLoop(recorder, config)
  }

  fun stop() {
    if (!isStreaming) return
    isStreaming = false
    captureJob?.cancel()
    captureJob = null
    audioRecord?.stop()
    audioRecord?.release()
    audioRecord = null
    emitStatus()
  }

  private fun resolveAudioConfig(): ResolvedAudioConfig {
    val channelConfig = if (options.channels == 2) {
      AudioFormat.CHANNEL_IN_STEREO
    } else {
      AudioFormat.CHANNEL_IN_MONO
    }

    val isInt16 = options.encoding == AudioStreamEncoding.INT16
    val audioEncoding = if (isInt16) {
      AudioFormat.ENCODING_PCM_16BIT
    } else {
      AudioFormat.ENCODING_PCM_FLOAT
    }

    val minBufferSize = AudioRecord.getMinBufferSize(options.sampleRate, channelConfig, audioEncoding)

    val sampleRate = if (minBufferSize == AudioRecord.ERROR_BAD_VALUE || minBufferSize == AudioRecord.ERROR) {
      FALLBACK_SAMPLE_RATES.firstOrNull { rate ->
        AudioRecord.getMinBufferSize(rate, channelConfig, audioEncoding) > 0
      } ?: throw AudioStreamUnsupportedConfigException(
        "No supported audio configuration found for this device. " +
          "The requested sample rate (${options.sampleRate} Hz), channel count (${options.channels}), " +
          "and encoding (${options.encoding}) are not supported by the hardware. " +
          "Try reducing channels to 1 or changing the encoding to 'int16'."
      )
    } else {
      options.sampleRate
    }

    val resolvedMinBuffer = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioEncoding)
    val bytesPerSample = if (isInt16) 2 else 4
    val channelCount = if (options.channels == 2) 2 else 1
    val desiredBufferSize = sampleRate * channelCount * bytesPerSample * DEFAULT_BUFFER_DURATION_MS / 1000
    val bufferSize = maxOf(resolvedMinBuffer, desiredBufferSize)

    return ResolvedAudioConfig(
      sampleRate = sampleRate,
      channelCount = channelCount,
      channelConfig = channelConfig,
      audioEncoding = audioEncoding,
      bytesPerSample = bytesPerSample,
      bufferSize = bufferSize,
      readSize = desiredBufferSize
    )
  }

  @RequiresPermission(Manifest.permission.RECORD_AUDIO)
  private fun createAudioRecord(config: ResolvedAudioConfig): AudioRecord {
    val recorder = AudioRecord(
      MediaRecorder.AudioSource.MIC,
      config.sampleRate,
      config.channelConfig,
      config.audioEncoding,
      config.bufferSize
    )

    if (recorder.state != AudioRecord.STATE_INITIALIZED) {
      recorder.release()
      throw AudioStreamInitializationException(
        "Failed to initialize AudioRecord. " +
          "Ensure microphone permission is granted by calling requestRecordingPermissionsAsync() before starting the stream. " +
          "If the permission is already granted, another app or AudioRecorder may be holding the microphone."
      )
    }

    return recorder
  }

  private fun startCaptureLoop(recorder: AudioRecord, config: ResolvedAudioConfig) {
    captureJob = coroutineScope.launch {
      val readSizeBytes = config.readSize

      while (isActive && isStreaming) {
        readAndEmit(recorder, readSizeBytes, config.channelCount, config.sampleRate)
      }
    }
  }

  private fun readAndEmit(
    recorder: AudioRecord,
    readSizeBytes: Int,
    channels: Int,
    sampleRate: Int
  ) {
    val byteBuffer = ByteBuffer.allocateDirect(readSizeBytes).order(ByteOrder.nativeOrder())
    val bytesRead = recorder.read(byteBuffer, readSizeBytes, AudioRecord.READ_BLOCKING)
    if (bytesRead > 0) {
      byteBuffer.limit(bytesRead)
      emitBufferEvent(NativeArrayBuffer(byteBuffer), channels, sampleRate)
    }
  }

  private fun emitStatus() {
    appContext?.mainQueue?.launch {
      emit(
        AUDIO_STREAM_STATUS,
        mapOf("isStreaming" to isStreaming)
      )
    }
  }

  private fun emitBufferEvent(data: NativeArrayBuffer, channels: Int, sampleRate: Int) {
    val timestamp = (System.nanoTime() - startTimeNanos) / 1_000_000_000.0

    appContext?.mainQueue?.launch {
      emit(
        AUDIO_STREAM_BUFFER,
        mapOf(
          "data" to data,
          "sampleRate" to sampleRate,
          "channels" to channels,
          "timestamp" to timestamp
        )
      )
    }
  }

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    stop()
  }
}
