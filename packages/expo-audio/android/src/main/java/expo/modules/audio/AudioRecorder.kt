package expo.modules.audio

import android.content.Context
import android.media.MediaRecorder
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import java.io.File
import java.io.IOException
import java.util.UUID

class AudioRecorder(
  context: Context,
  appContext: AppContext,
  options: RecordingOptions
) : SharedObject(appContext) {
  private var filePath: String? = null

  val recorder = MediaRecorder().apply {
    setAudioSource(MediaRecorder.AudioSource.DEFAULT)
    setOutputFormat(options.outputFormat.toMediaOutputFormat())
    setAudioEncoder(options.audioEncoder.toMediaEncoding())
    // create file

    val filename = "recording-${UUID.randomUUID()}${options.extension}"

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
    setOutputFile(filePath)

    prepare()
  }
  var isRecording = false
  
  override fun deallocate() {
    recorder.release()
  }
}

private fun ensureDirExists(dir: File): File {
  if (!(dir.isDirectory() || dir.mkdirs())) {
    throw IOException("Couldn't create directory '$dir'")
  }
  return dir
}

