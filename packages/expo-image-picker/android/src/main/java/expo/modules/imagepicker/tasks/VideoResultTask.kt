package expo.modules.imagepicker.tasks

import android.content.ContentResolver
import android.media.MediaMetadataRetriever
import android.net.Uri
import expo.modules.imagepicker.FailedToExtractVideoMetadataException
import expo.modules.imagepicker.FailedToWriteFileException
import expo.modules.imagepicker.ImagePickerMediaResponse
import expo.modules.imagepicker.UnknownException
import expo.modules.imagepicker.fileproviders.FileProvider
import expo.modules.kotlin.Promise
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
        val response = ImagePickerMediaResponse.Video(
          uri = Uri.fromFile(outputFile).toString(),
          width = extractMediaMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH),
          height = extractMediaMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT),
          rotation = extractMediaMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION),
          duration = extractMediaMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
        )
        promise.resolve(response)
      } catch (e: NullPointerException) {
        promise.reject(FailedToExtractVideoMetadataException(e))
      } catch (e: IllegalArgumentException) {
        promise.reject(FailedToExtractVideoMetadataException(e))
      } catch (e: SecurityException) {
        promise.reject(FailedToExtractVideoMetadataException(e))
      } catch (e: IOException) {
        promise.reject(FailedToWriteFileException(null, e))
      } catch (e: Exception) {
        promise.reject(UnknownException(e))
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
