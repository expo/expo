package expo.modules.imagepicker

import android.content.ClipData
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.DocumentsContract
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
import kotlin.io.use

internal fun createOutputFile(cacheDir: File, extension: String): File {
  val filePath = FileUtilities.generateOutputPath(cacheDir, ImagePickerConstants.CACHE_DIR_NAME, extension)
  return try {
    File(filePath).apply { createNewFile() }
  } catch (cause: IOException) {
    throw FailedToCreateFileException(filePath, cause)
  }
}

internal fun getType(contentResolver: ContentResolver, uri: Uri): String? {
  val mimeFromCursor: () -> String? = {
    contentResolver
      .query(
        uri,
        listOf(DocumentsContract.Document.COLUMN_MIME_TYPE).toTypedArray(),
        null,
        null,
        null
      ).use { cursor ->
        if (cursor?.moveToFirst() == true) {
          val columnIndex = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_MIME_TYPE)
          if (columnIndex != -1 && !cursor.isNull(columnIndex)) {
            cursor.getString(columnIndex)
          }
        }
        null
      }
  }

  return contentResolver.getType(uri)
    ?: mimeFromCursor()
    ?: getTypeFromFileUrl(uri.toString())
}

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
  this.endsWith("webp", ignoreCase = true) -> ".webp"
  !this.endsWith("jpeg", ignoreCase = true) -> {
    Log.w(TAG, "Image file $this is of unsupported type. Falling back to JPEG instead.")
    ".jpeg"
  }
  else -> ".jpeg"
}

internal fun Uri.toMediaType(contentResolver: ContentResolver): MediaType? {
  val type = getType(contentResolver, this)
  return when {
    type?.contains("image/") == true -> MediaType.IMAGE
    type?.contains("video/") == true -> MediaType.VIDEO
    else -> null
  }
}

internal fun String.toBitmapCompressFormat(): Bitmap.CompressFormat = when {
  this.endsWith("png", ignoreCase = true) ||
    this.endsWith("gif", ignoreCase = true) ||
    this.endsWith("bmp", ignoreCase = true) ||
    this.endsWith("webp", ignoreCase = true) -> {
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
 * [Iterable] implementation for [ClipData] items
 */
val ClipData.items: Iterable<ClipData.Item>
  get() = object : Iterable<ClipData.Item> {
    override fun iterator() = object : Iterator<ClipData.Item> {
      var index = 0
      val count = itemCount

      override fun hasNext(): Boolean = index < count

      override fun next(): ClipData.Item = getItemAt(index++)
    }
  }

/**
 * Gets all data that is associated with this [Intent].
 * Original data order is preserved.
 *
 * Adapted from [androidx.activity.result.contract.ActivityResultContracts.GetMultipleContents.getClipDataUris]
 */
internal fun Intent.getAllDataUris(): List<Uri> {
  // Use a LinkedHashSet to maintain any ordering that may be present in the ClipData
  val resultSet = LinkedHashSet<Uri>()

  data
    ?.let { resultSet.add(it) }

  clipData
    ?.items
    ?.map { it.uri }
    ?.let { resultSet.addAll(it) }

  return resultSet.toList()
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
  contentResolver: ContentResolver
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
    ExifInterface.TAG_ORIENTATION
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

/*
Getting asset ID (and metadata) on Android is not that obvious. When getting a `content://` URI
using `ACTION_GET_CONTENT` or `ACTION_OPEN_DOCUMENT` intents, there are 3 possible ways:

1. When the user selects a photo from **Images** section of the picker (on the left drawer)
  In this case we get a URI from `com.android.providers.media.MediaDocumentsProvider`,
  that inherits from `DocumentsProvider`. The URI looks like this:
  ```
  com.android.providers.media.documents/document/image:56
  ```
  In this case, the `56` is the ID we're looking for.

2. When the user selects a photo from **Downloads** section, another content provider is used:
  `DownloadStorageProvider` which is a bit different, and also differs depending on Android version:
  - On API 29+ it also inherits from `com.android.providers.downloads.DocumentsProvider`
    and the URI looks like this:
    ```
    com.android.providers.downloads.documents/document/msf:56
    ```
    Where "msf" is abbr. of "media store file" and 56 is our asset ID
  - On API <29 it looks similar:
    ```
    com.android.providers.downloads.documents/document/128
    ```
    but the 128 is an internal ID of downloads provider, unrelated to media store asset ID.

3. When the user selects a photo by browsing the filesystem, the URI looks like this:
  ```
  com.android.externalstorage.documents/document/primary:Download:filename.jpg
  ```
  No ID in this case
 */

/**
 * Checks whether this [Uri] is a `com.android.providers.media.documents` provider uri
 */
internal val Uri.isMediaProviderUri
  get() = this.authority == "com.android.providers.media.documents"

/**
 * Checks whether this [Uri] is a `com.android.providers.downloads.documents` provider uri
 */
internal val Uri.isDownloadsProviderUri
  get() = this.authority == "com.android.providers.downloads.documents"

/**
 * Checks whether asset represented by this [Uri] can be queried in the media store
 */
internal val Uri.isMediaStoreAssetUri
  get() = isMediaProviderUri || (
    isDownloadsProviderUri &&
      DocumentsContract
        .getDocumentId(this)
        .startsWith("msf:")
    )

/**
 * If the URI represents a media store asset, this returns its ID. Otherwise, returns `null`.
 *
 * See the detailed explanation above in this file (ImagePickerUtils.kt).
 */
internal fun Uri.getMediaStoreAssetId(): String? {
  if (isMediaStoreAssetUri) {
    val rawId = DocumentsContract.getDocumentId(this)
    return if (rawId.contains(':')) rawId.split(':')[1] else rawId
  }
  return null
}
