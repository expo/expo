package expo.modules.imagepicker.tasks

import android.content.ContentResolver
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Bundle
import android.util.Log
import expo.modules.core.Promise
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.imagepicker.ImagePickerConstants
import expo.modules.imagepicker.fileproviders.FileProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class VideoResultTask(
  private val promise: Promise,
  private val uri: Uri,
  private val contentResolver: ContentResolver,
  private val fileProvider: FileProvider,
  private val mediaMetadataRetriever: MediaMetadataRetriever,
  private val coroutineScope: CoroutineScope
) {
  private fun extractMediaMetadata(key: Int): Int =
    mediaMetadataRetriever.extractMetadata(key)!!.toInt()

  /**
   * We need to make coroutine wait till the video is saved, while the underlying
   * thread is free to continue executing other coroutines.
   */
  private suspend fun getFile(): File = suspendCancellableCoroutine { cancellableContinuation ->
    try {
      val outputFile = fileProvider.generateFile()
      saveVideo(outputFile)
      cancellableContinuation.resume(outputFile)
    } catch (e: Exception) {
      cancellableContinuation.resumeWithException(e)
    }
  }

  fun execute() {
    coroutineScope.launch {
      try {
        val outputFile = getFile()
        val response = Bundle().apply {
          putString("uri", Uri.fromFile(outputFile).toString())
          putBoolean("cancelled", false)
          putString("type", "video")
          putInt("width", extractMediaMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH))
          putInt("height", extractMediaMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT))
          putInt("rotation", extractMediaMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION))
          putInt("duration", extractMediaMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION))
        }
        promise.resolve(response)
      } catch (e: ModuleDestroyedException) {
        Log.d(ImagePickerConstants.TAG, ImagePickerConstants.COROUTINE_CANCELED, e)
        promise.reject(e)
      } catch (e: NullPointerException) {
        promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
      } catch (e: IllegalArgumentException) {
        promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
      } catch (e: SecurityException) {
        promise.reject(ImagePickerConstants.ERR_CAN_NOT_EXTRACT_METADATA, ImagePickerConstants.CAN_NOT_EXTRACT_METADATA_MESSAGE, e)
      } catch (e: IOException) {
        promise.reject(ImagePickerConstants.ERR_CAN_NOT_SAVE_RESULT, ImagePickerConstants.CAN_NOT_SAVE_RESULT_MESSAGE, e)
      } catch (e: Exception) {
        Log.e(ImagePickerConstants.TAG, ImagePickerConstants.UNKNOWN_EXCEPTION, e)
        promise.reject(ImagePickerConstants.UNKNOWN_EXCEPTION, e)
      }
    }
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
