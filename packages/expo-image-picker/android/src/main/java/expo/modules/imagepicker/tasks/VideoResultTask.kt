package expo.modules.imagepicker.tasks

import android.content.ContentResolver
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Bundle
import expo.modules.imagepicker.ImagePickerConstants
import expo.modules.imagepicker.fileproviders.FileProvider
import org.unimodules.core.Promise
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class VideoResultTask(promise: Promise,
                      uri: Uri,
                      contentResolver: ContentResolver,
                      fileProvider: FileProvider,
                      private val mMediaMetadataRetriever: MediaMetadataRetriever)
  : ImagePickerResultTask(promise, uri, contentResolver, fileProvider) {

  override fun doInBackground(vararg params: Void?): Void? {
    try {
      val outputFile = fileProvider.generateFile()
      saveVideo(outputFile)
      val response = Bundle().apply {
        putString("uri", outputFile.toURI().toString())
        putBoolean("cancelled", false)
        putString("type", "video")
        putInt("width", mMediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH).toInt())
        putInt("height", mMediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT).toInt())
        putInt("rotation", mMediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION).toInt())
        putInt("duration", mMediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION).toInt())
      }
      promise.resolve(response)
    } catch (e: IllegalArgumentException) {
      promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
    } catch (e: SecurityException) {
      promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
    } catch (e: IOException) {
      promise.reject(ImagePickerConstants.ERR_CAN_NOT_SAVE_RESULT, ImagePickerConstants.CAN_NOT_SAVE_RESULT_MESSAGE, e)
    }
    return null
  }

  @Throws(IOException::class)
  private fun saveVideo(outputFile: File) {
    contentResolver.openInputStream(uri)?.use { input ->
      FileOutputStream(outputFile).use { out ->
        val buffer = ByteArray(4096)
        var bytesRead: Int
        while (input.read(buffer).also { bytesRead = it } > 0) {
          out.write(buffer, 0, bytesRead)
        }
      }
    }
  }

}
