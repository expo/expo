package expo.modules.audio

import android.content.Context
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

class AudioRecorder(
  val context: Context,
  appContext: AppContext,
  private val options: RecordingOptions
) : SharedObject(appContext), MediaRecorder.OnErrorListener, MediaRecorder.OnInfoListener {
  private var filePath: String? = null
  private var meteringEnabled = false
  private var durationAlreadyRecorded = 0L

  val id = UUID.randomUUID()
  var uri: String? = null
  var uptime = 0L
  var isRecording = false

  private var _recorder: MediaRecorder? = null

  val recorder: MediaRecorder get() = _recorder ?: createRecorder(options)

  private fun getAudioRecorderLevels(): Int {
    if (!meteringEnabled) {
      return -160
    }
    val amplitude: Int = recorder.maxAmplitude
    return if (amplitude == 0) {
      -160
    } else (20 * ln(amplitude.toDouble() / 32767.0)).toInt()
  }

  private fun createRecorder(options: RecordingOptions): MediaRecorder {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      MediaRecorder(context)
    } else {
      MediaRecorder()
    }.apply {
      setAudioSource(MediaRecorder.AudioSource.DEFAULT)
      setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
      if (options.audioEncoder != null) {
        setAudioEncoder(options.audioEncoder.toMediaEncoding())
      } else {
        setAudioEncoder(MediaRecorder.AudioEncoder.DEFAULT)
      }

      options.sampleRate?.let {
        this.setAudioSamplingRate(it.toInt())
      }
      options.numberOfChannels?.let {
        this.setAudioChannels(it.toInt())
      }
      options.bitRate?.let {
        this.setAudioEncodingBitRate(it.toInt())
      }
      options.maxFileSize?.let {
        this.setMaxFileSize(it.toLong())
      }
      setOnErrorListener(this@AudioRecorder)
      setOnInfoListener(this@AudioRecorder)
      setOutputFile(filePath)
      uri = filePath
      prepare()
    }
  }

  override fun deallocate() {
    _recorder = null
    recorder.release()
  }

  fun stopRecording(): Bundle {
    isRecording = false
    recorder.stop()
    _recorder = null
    return getAudioRecorderStatus()
  }

  fun getAudioRecorderStatus(): Bundle {
    val map = Bundle()
    map.putBoolean("canRecord", true)
    map.putBoolean("isRecording", isRecording)
    map.putLong("durationMillis", getAudioRecorderDurationMillis())
    if (meteringEnabled) {
      map.putInt("metering", getAudioRecorderLevels())
    }
    return map
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
    sendEvent("onRecordingStatusUpdate", mapOf(
      "isFinished" to true,
      "hasError" to true,
      "error" to error,
      "url" to null
    ))
  }

  override fun onInfo(mr: MediaRecorder?, what: Int, extra: Int) {
    when (what) {
      MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED -> {
        recorder.stop()
        sendEvent("onRecordingStatusUpdate", mapOf(
          "isFinished" to true,
          "hasError" to true,
          "url" to Uri.fromFile(filePath?.let { File(it) }).toString()
        ))
      }
    }
  }
}

private fun ensureDirExists(dir: File): File {
  if (!(dir.isDirectory() || dir.mkdirs())) {
    throw IOException("Couldn't create directory '$dir'")
  }
  return dir
}