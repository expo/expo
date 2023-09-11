package expo.modules.medialibrary.assets

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.Promise
import expo.modules.medialibrary.AssetException
import expo.modules.medialibrary.AssetFileException
import expo.modules.medialibrary.ContentEntryException
import expo.modules.medialibrary.ERROR_IO_EXCEPTION
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.ERROR_UNABLE_TO_SAVE
import expo.modules.medialibrary.MediaLibraryUtils
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

class CreateAsset @JvmOverloads constructor(
  private val context: Context,
  uri: String,
  private val promise: Promise,
  private val resolveWithAdditionalData: Boolean = true
) {
  private val mUri = normalizeAssetUri(uri)

  private fun normalizeAssetUri(uri: String): Uri {
    return if (uri.startsWith("/")) {
      Uri.fromFile(File(uri))
    } else {
      Uri.parse(uri)
    }
  }

  private val isFileExtensionPresent: Boolean
    get() = mUri.lastPathSegment?.contains(".") ?: false

  /**
   * Creates asset entry in database
   * @return uri to created asset or null if it fails
   */
  @RequiresApi(api = Build.VERSION_CODES.Q)
  private fun createContentResolverAssetEntry(): Uri? {
    val contentResolver = context.contentResolver
    val mimeType = MediaLibraryUtils.getMimeType(contentResolver, mUri)
    val filename = mUri.lastPathSegment
    val path = MediaLibraryUtils.getRelativePathForAssetType(mimeType, true)

    val contentUri = MediaLibraryUtils.mimeTypeToExternalUri(mimeType)
    val contentValues = ContentValues().apply {
      put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
      put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
      put(MediaStore.MediaColumns.RELATIVE_PATH, path)
      put(MediaStore.MediaColumns.IS_PENDING, 1)
    }
    return contentResolver.insert(contentUri, contentValues)
  }

  /**
   * Same as [MediaLibraryUtils.safeCopyFile] but takes Content URI as destination
   */
  @RequiresApi(api = Build.VERSION_CODES.Q)
  @Throws(IOException::class)
  private fun writeFileContentsToAsset(localFile: File, assetUri: Uri) {
    val contentResolver = context.contentResolver
    FileInputStream(localFile).channel.use { input ->
      (contentResolver.openOutputStream(assetUri) as FileOutputStream).channel.use { output ->
        val transferred = input.transferTo(0, input.size(), output)
        if (transferred != input.size()) {
          contentResolver.delete(assetUri, null, null)
          throw IOException("Could not save file to $assetUri Not enough space.")
        }
      }
    }

    // After writing contents, set IS_PENDING flag back to 0
    val values = ContentValues().apply {
      put(MediaStore.MediaColumns.IS_PENDING, 0)
    }
    contentResolver.update(assetUri, values, null, null)
  }

  /**
   * Recommended method of creating assets since API 30
   */
  @RequiresApi(api = Build.VERSION_CODES.R)
  @Throws(IOException::class)
  private fun createAssetUsingContentResolver() {
    val assetUri = createContentResolverAssetEntry().ifNull {
      throw ContentEntryException()
    }
    writeFileContentsToAsset(File(mUri.path!!), assetUri)

    if (resolveWithAdditionalData) {
      val selection = "${MediaStore.MediaColumns._ID}=?"
      val args = arrayOf(ContentUris.parseId(assetUri).toString())
      queryAssetInfo(context, selection, args, false, promise)
    } else {
      promise.resolve(null)
    }
  }

  /**
   * Creates asset using filesystem. Legacy method - do not use above API 29
   */
  @Throws(IOException::class)
  private fun createAssetFileLegacy(): File {
    val localFile = File(mUri.path!!)

    val destDir = MediaLibraryUtils.getEnvDirectoryForAssetType(
      MediaLibraryUtils.getMimeType(context.contentResolver, mUri),
      true
    ).ifNull {
      throw AssetFileException("Could not guess file type.")
    }

    val destFile = MediaLibraryUtils.safeCopyFile(localFile, destDir)
    if (!destDir.exists() || !destFile.isFile) {
      throw AssetFileException("Could not create asset record. Related file does not exist.")
    }
    return destFile
  }

  fun execute() {
    if (!isFileExtensionPresent) {
      throw AssetFileException("Could not get the file's extension.")
    }
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        createAssetUsingContentResolver()
        return
      }

      val asset = createAssetFileLegacy()
      MediaScannerConnection.scanFile(
        context, arrayOf(asset.path),
        null
      ) { path: String, uri: Uri? ->
        if (uri == null) {
          throw AssetException()
        }
        if (resolveWithAdditionalData) {
          val selection = MediaStore.Images.Media.DATA + "=?"
          val args = arrayOf(path)
          queryAssetInfo(context, selection, args, false, promise)
        } else {
          promise.resolve(null)
        }
      }
    } catch (e: IOException) {
      promise.reject(ERROR_IO_EXCEPTION, "Unable to copy file into external storage.", e)
    } catch (e: SecurityException) {
      promise.reject(
        ERROR_UNABLE_TO_LOAD_PERMISSION,
        "Could not get asset: need READ_EXTERNAL_STORAGE permission.", e
      )
    } catch (e: Exception) {
      promise.reject(ERROR_UNABLE_TO_SAVE, "Could not create asset.", e)
    }
  }
}
