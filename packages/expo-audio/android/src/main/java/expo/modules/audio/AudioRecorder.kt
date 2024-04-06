package expo.modules.audio

import android.content.Context
import android.media.MediaRecorder
import android.media.MediaRecorder.MEDIA_ERROR_SERVER_DIED
import android.media.MediaRecorder.MEDIA_RECORDER_ERROR_UNKNOWN
import android.media.MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.io.IOException
import java.util.UUID
import kotlin.math.ln

class AudioRecorder(
  context: Context,
  appContext: AppContext,
  options: RecordingOptions
) : SharedObject(appContext), MediaRecorder.OnErrorListener, MediaRecorder.OnInfoListener {
  private var filePath: String? = null
  private var meteringEnabled = false
  private var durationAlreadyRecorded = 0L

  var uptime = 0L
  var isRecording = false

  val recorder = MediaRecorder().apply {
    setAudioSource(MediaRecorder.AudioSource.DEFAULT)
    setOutputFormat(options.outputFormat.toMediaOutputFormat())
    setAudioEncoder(options.audioEncoder.toMediaEncoding())

    val filename = "recording-${UUID.randomUUID()}${options.extension}"
    meteringEnabled = options.isMeteringEnabled ?: false

    try {
      val directory = File("${context.cacheDir}${File.separator}Audio")
      ensureDirExists(directory)
      filePath = "${directory}${File.separator}$filename"
    } catch (_: IOException) {
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
    prepare()
  }

  private fun getAudioRecorderLevels(): Int {
    if (!meteringEnabled) {
      return -160
    }
    val amplitude: Int = recorder.maxAmplitude
    return if (amplitude == 0) {
      -160
    } else (20 * ln(amplitude.toDouble() / 32767.0)).toInt()
  }

  override fun deallocate() {
    recorder.release()
  }

  fun getAudioRecorderStatus(): Bundle {
    val map = Bundle()
    map.putBoolean("canRecord", true)
    map.putBoolean("isRecording", isRecording)
    map.putInt("durationMillis", getAudioRecorderDurationMillis().toInt())
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
