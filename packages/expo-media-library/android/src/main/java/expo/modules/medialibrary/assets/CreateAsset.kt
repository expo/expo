package expo.modules.medialibrary.assets

import android.os.AsyncTask
import android.content.ContentValues
import android.provider.MediaStore
import android.content.ContentUris
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.core.Promise
import expo.modules.core.utilities.ifNull
import expo.modules.medialibrary.ERROR_IO_EXCEPTION
import expo.modules.medialibrary.ERROR_NO_FILE_EXTENSION
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.ERROR_UNABLE_TO_SAVE
import expo.modules.medialibrary.MediaLibraryUtils
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.lang.Exception

class CreateAsset @JvmOverloads constructor(
  private val context: Context,
  uri: String,
  private val promise: Promise,
  private val resolveWithAdditionalData: Boolean = true
) : AsyncTask<Void?, Void?, Void?>() {
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
      promise.reject(ERROR_UNABLE_TO_SAVE, "Could not create content entry.")
      return
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
  private fun createAssetFileLegacy(): File? {
    val localFile = File(mUri.path!!)

    val destDir = MediaLibraryUtils.getEnvDirectoryForAssetType(
      MediaLibraryUtils.getMimeType(context.contentResolver, mUri),
      true
    ).ifNull {
      promise.reject(ERROR_UNABLE_TO_SAVE, "Could not guess file type.")
      return null
    }

    val destFile = MediaLibraryUtils.safeCopyFile(localFile, destDir)
    if (!destDir.exists() || !destFile.isFile) {
      promise.reject(ERROR_UNABLE_TO_SAVE, "Could not create asset record. Related file is not existing.")
      return null
    }
    return destFile
  }

  override fun doInBackground(vararg params: Void?): Void? {
    if (!isFileExtensionPresent) {
      promise.reject(ERROR_NO_FILE_EXTENSION, "Could not get the file's extension.")
      return null
    }
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        createAssetUsingContentResolver()
        return null
      }

      val asset = createAssetFileLegacy() ?: return null
      MediaScannerConnection.scanFile(
        context, arrayOf(asset.path),
        null
      ) { path: String, uri: Uri? ->
        if (uri == null) {
          promise.reject(ERROR_UNABLE_TO_SAVE, "Could not add image to gallery.")
          return@scanFile
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
    return null
  }
}
