package expo.modules.videothumbnails

import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Log
import android.webkit.URLUtil
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.core.utilities.FileUtilities
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.OutputStream

class VideoThumbnailsModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)

  override fun definition() = ModuleDefinition {
    Name("ExpoVideoThumbnails")

    AsyncFunction("getThumbnail") { sourceFilename: String, options: VideoThumbnailOptions, promise: Promise ->
      if (URLUtil.isFileUrl(sourceFilename) && !isAllowedToRead(Uri.decode(sourceFilename).replace("file://", ""))) {
        throw ThumbnailException()
      }

      withModuleScope(promise) {
        val thumbnail = GetThumbnail(sourceFilename, options, context).execute()
          ?: throw GenerateThumbnailException()

        try {
          val path = FileUtilities.generateOutputPath(context.cacheDir, "VideoThumbnails", "jpg")
          val outputStream: OutputStream = FileOutputStream(path)
          thumbnail.compress(Bitmap.CompressFormat.JPEG, (options.quality * 100).toInt(), outputStream)
          outputStream.flush()
          outputStream.close()
          promise.resolve(
            VideoThumbnailResult(
              uri = Uri.fromFile(File(path)).toString(),
              width = thumbnail.width,
              height = thumbnail.height
            )
          )
        } catch (ex: IOException) {
          promise.reject(ERROR_TAG, ex.message, ex)
        } catch (ex: RuntimeException) {
          promise.reject(ERROR_TAG, ex.message, ex)
        }
      }
    }

    OnDestroy {
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.e(TAG, "The scope does not have a job in it")
      }
    }
  }

  private class GetThumbnail(private val sourceFilename: String, private val videoOptions: VideoThumbnailOptions, private val context: Context) {
    fun execute(): Bitmap? {
      val retriever = MediaMetadataRetriever()

      if (URLUtil.isFileUrl(sourceFilename)) {
        retriever.setDataSource(Uri.decode(sourceFilename).replace("file://", ""))
      } else if (URLUtil.isContentUrl(sourceFilename)) {
        val fileUri = Uri.parse(sourceFilename)
        val descriptor = context.contentResolver.openFileDescriptor(fileUri, "r")
        val fileDescriptor = descriptor!!.fileDescriptor
        val inputStream = FileInputStream(fileDescriptor)
        retriever.setDataSource(inputStream.fd)
        descriptor.close()
      } else {
        retriever.setDataSource(sourceFilename, videoOptions.headers)
      }

      return retriever.getFrameAtTime(videoOptions.time.toLong() * 1000, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
    }
  }

  private fun isAllowedToRead(url: String): Boolean {
    val permissionModuleInterface = appContext.filePermission
      ?: throw FilePermissionsModuleNotFound()
    return permissionModuleInterface.getPathPermissions(context, url).contains(Permission.READ)
  }

  private inline fun withModuleScope(promise: Promise, crossinline block: () -> Unit) = moduleCoroutineScope.launch {
    try {
      block()
    } catch (e: CodedException) {
      promise.reject(e)
    } catch (e: ModuleDestroyedException) {
      promise.reject(TAG, "VideoThumbnails module destroyed", e)
    }
  }

  companion object {
    private const val TAG = "ExpoVideoThumbnails"
    private const val ERROR_TAG = "E_VIDEO_THUMBNAILS"
  }
}
