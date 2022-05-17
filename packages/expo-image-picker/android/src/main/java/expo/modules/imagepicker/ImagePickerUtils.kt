package expo.modules.imagepicker

import android.content.ContentResolver
import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Log
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import androidx.core.net.toFile
import expo.modules.core.utilities.FileUtilities
import expo.modules.imagepicker.ImagePickerConstants.TAG
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.providers.ContextProvider
import kotlinx.coroutines.CoroutineExceptionHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runInterruptible
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.IOException


internal fun createOutputFile(cacheDir: File, extension: String): File {
  val filePath = FileUtilities.generateOutputPath(cacheDir, ImagePickerConstants.CACHE_DIR_NAME, extension)
  return try {
    File(filePath).apply { createNewFile() }
  } catch (cause: IOException) {
    throw FailedToCreateFileException(filePath, cause)
  }
}

internal fun getType(contentResolver: ContentResolver, uri: Uri): String =
  contentResolver.getType(uri)
    ?: getTypeFromFileUrl(uri.toString())
    ?: throw FailedDeducingTypeException()

private fun getTypeFromFileUrl(url: String): String? {
  val extension = MimeTypeMap.getFileExtensionFromUrl(url)
  return extension?.let { MimeTypeMap.getSingleton().getMimeTypeFromExtension(it) }
}

/**
 * Convert this [File] to [Uri] that might be accessed by 3rd party Activities, eg. by camera application
 */
internal fun File.toContentUri(context: Context): Uri {
  return try {
    FileProvider.getUriForFile(context, context.packageName + ".ImagePickerFileProvider", this)
  } catch (e: Exception) {
    Uri.fromFile(this)
  }
}

internal fun File.toBitmapCompressFormat(): Bitmap.CompressFormat = when {
  this.extension.contains("png") -> Bitmap.CompressFormat.PNG
  else -> Bitmap.CompressFormat.JPEG
}

internal fun Bitmap.CompressFormat.toFileExtension(): String {
  return when(this) {
    Bitmap.CompressFormat.PNG -> ".png"
    Bitmap.CompressFormat.JPEG -> ".jpeg"
    else -> throw RuntimeException("Compress format not supported '${this.name}'")
  }
}

internal fun String.toFileExtension(): String = when {
  this.contains("png") -> ".png"
  this.contains("gif") -> ".gif"
  this.contains("bmp") -> ".bmp"
  !this.contains("jpeg") -> {
    Log.w(TAG, "Image type not supported. Falling back to JPEG instead.")
    ".jpeg"
  }
  else -> ".jpeg"
}

internal fun String.toBitmapCompressFormat(): Bitmap.CompressFormat = when {
  this.contains("png") ||
  this.contains("gif") ||
  this.contains("bmp") -> {
    // The result image won't ever be a GIF of a BMP as the cropper doesn't support it.
    Bitmap.CompressFormat.PNG
  }
  else -> {
    if (!this.contains("jpeg")) {
      Log.w(TAG, "Image type not supported. Falling back to JPEG instead.")
    }
    Bitmap.CompressFormat.JPEG
  }
}

internal fun MediaMetadataRetriever.extractInt(key: Int): Int {
  return this.extractMetadata(key)?.toInt() ?: throw FailedToExtractVideoMetadataException()
}

/**
 * Copy the media file from `sourceUri` to `destinationUri`.
 *
 * @param sourceUri uri to the file to copy the data from
 * @param targetFile file to save the media data into
 */
internal suspend fun copyFile(
  sourceUri: Uri,
  targetFile: File,
  contextProvider: ContextProvider,
) = runInterruptible {
  val destinationUri = Uri.fromFile(targetFile)

  // source and destination are the same file
  if (sourceUri.compareTo(destinationUri) == 0) {
    return@runInterruptible
  }

  try {
    contextProvider.context.contentResolver.openInputStream(sourceUri)?.use { inputStream ->
      FileOutputStream(targetFile).use { fileOutputStream ->
        inputStream.copyTo(fileOutputStream)
        return@runInterruptible
      }
    } ?: throw FailedToReadFileException(sourceUri.toFile())
  } catch (cause: FileNotFoundException) {
    throw FailedToWriteFileException(targetFile, cause)
  }
}

/**
 * The same as [CoroutineScope.launch] but with built-in exception handler
 * that relays caught exceptions to [Promise.reject] ensuring that these are wrapped in [CodedException].
 *
 * TODO(@bbarthec): inspect whether not to add this to the [AsyncFunction] definition
 */
internal fun CoroutineScope.launchWithPromiseExceptionHandler(
  promise: Promise,
  block: suspend CoroutineScope.() -> Unit
) {
  val exceptionHandler = CoroutineExceptionHandler { _, err ->
    val cause = when (err) {
      is CodedException -> err
      else -> UnexpectedException(err)
    }
    promise.reject(cause)
  }

  launch(exceptionHandler, block = block)
}
