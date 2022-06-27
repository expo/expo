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
import androidx.exifinterface.media.ExifInterface
import expo.modules.core.utilities.FileUtilities
import expo.modules.imagepicker.ImagePickerConstants.TAG
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
    ?: throw FailedToDeduceTypeException()

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
  this.extension.endsWith("png", ignoreCase = true) -> Bitmap.CompressFormat.PNG
  else -> Bitmap.CompressFormat.JPEG
}

internal fun Bitmap.CompressFormat.toImageFileExtension(): String {
  return when (this) {
    Bitmap.CompressFormat.PNG -> ".png"
    Bitmap.CompressFormat.JPEG -> ".jpeg"
    else -> throw RuntimeException("Compress format not supported '${this.name}'")
  }
}

internal fun String.toImageFileExtension(): String = when {
  this.endsWith("png", ignoreCase = true) -> ".png"
  this.endsWith("gif", ignoreCase = true) -> ".gif"
  this.endsWith("bmp", ignoreCase = true) -> ".bmp"
  !this.endsWith("jpeg", ignoreCase = true) -> {
    Log.w(TAG, "Image file $this is of unsupported type. Falling back to JPEG instead.")
    ".jpeg"
  }
  else -> ".jpeg"
}

internal fun Uri.toMediaType(contentResolver: ContentResolver): MediaType {
  val type = getType(contentResolver, this)
  return when {
    type.contains("image/") -> MediaType.IMAGE
    type.contains("video/") -> MediaType.VIDEO
    else -> throw FailedToDeduceTypeException()
  }
}

internal fun String.toBitmapCompressFormat(): Bitmap.CompressFormat = when {
  this.endsWith("png", ignoreCase = true) ||
    this.endsWith("gif", ignoreCase = true) ||
    this.endsWith("bmp", ignoreCase = true) -> {
    // The result image won't ever be a GIF of a BMP as the cropper doesn't support it.
    Bitmap.CompressFormat.PNG
  }
  else -> {
    if (!this.endsWith("jpeg", ignoreCase = true)) {
      Log.w(TAG, "Image file $this is of unsupported type. Falling back to JPEG instead.")
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
  contentResolver: ContentResolver,
) = runInterruptible {
  val targetUri = Uri.fromFile(targetFile)

  // source and destination are the same file
  if (sourceUri.compareTo(targetUri) == 0) {
    return@runInterruptible
  }

  try {
    contentResolver.openInputStream(sourceUri)?.use { inputStream ->
      FileOutputStream(targetFile).use { fileOutputStream ->
        inputStream.copyTo(fileOutputStream)
        return@runInterruptible
      }
    } ?: throw FailedToReadFileException(sourceUri.toFile())
  } catch (cause: FileNotFoundException) {
    throw FailedToWriteFileException(targetFile, cause)
  }
}

internal suspend fun copyExifData(
  sourceUri: Uri,
  targetFile: File,
  contentResolver: ContentResolver
) = runInterruptible {
  val targetUri = Uri.fromFile(targetFile)
  if (sourceUri.compareTo(targetUri) == 0) {
    return@runInterruptible
  }

  val omittableTags = listOf(
    ExifInterface.TAG_IMAGE_LENGTH,
    ExifInterface.TAG_IMAGE_WIDTH,
    ExifInterface.TAG_PIXEL_X_DIMENSION,
    ExifInterface.TAG_PIXEL_Y_DIMENSION,
    ExifInterface.TAG_ORIENTATION,
  )

  try {
    contentResolver.openInputStream(sourceUri)?.use { inputStream ->
      val sourceExif = ExifInterface(inputStream)
      val targetExif = ExifInterface(targetFile)
      ImagePickerConstants.EXIF_TAGS
        .filter { (_, tag) -> !omittableTags.contains(tag) }
        .map { (_, tag) -> tag to sourceExif.getAttribute(tag) }
        .filter { (_, value) -> value != null }
        .forEach { (tag, value) -> targetExif.setAttribute(tag, value) }

      try {
        targetExif.saveAttributes()
      } catch (cause: IOException) {
        throw FailedToWriteExifDataToFileException(targetFile, cause)
      }
    } ?: throw FailedToReadFileException(sourceUri.toFile())
  } catch (cause: FileNotFoundException) {
    throw FailedToWriteFileException(targetFile, cause)
  }
}
