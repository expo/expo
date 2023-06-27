package abi49_0_0.expo.modules.videothumbnails

import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Log
import android.webkit.URLUtil
import abi49_0_0.expo.modules.core.errors.ModuleDestroyedException
import abi49_0_0.expo.modules.core.utilities.FileUtilities
import abi49_0_0.expo.modules.interfaces.filesystem.Permission
import abi49_0_0.expo.modules.kotlin.Promise
import abi49_0_0.expo.modules.kotlin.exception.CodedException
import abi49_0_0.expo.modules.kotlin.exception.Exceptions
import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

class VideoThumbnailsModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)

  override fun definition() = ModuleDefinition {
    Name("ExpoVideoThumbnails")

    AsyncFunction("getThumbnail") { sourceFilename: String, options: VideoThumbnailOptions, promise: Promise ->
      if (URLUtil.isFileUrl(sourceFilename) && !isAllowedToRead(Uri.decode(sourceFilename).replace("file://", ""))) {
        throw ThumbnailFileException()
      }

      withModuleScope(promise) {
        val thumbnail = GetThumbnail(sourceFilename, options, context).execute()
          ?: throw GenerateThumbnailException()

        try {
          val path = FileUtilities.generateOutputPath(context.cacheDir, "VideoThumbnails", "jpg")
          FileOutputStream(path).use { outputStream ->
            thumbnail.compress(Bitmap.CompressFormat.JPEG, (options.quality * 100).toInt(), outputStream)
          }
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
        val fileDescriptor = context.contentResolver.openFileDescriptor(fileUri, "r")!!.fileDescriptor
        FileInputStream(fileDescriptor).use { inputStream ->
          retriever.setDataSource(inputStream.fd)
        }
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
