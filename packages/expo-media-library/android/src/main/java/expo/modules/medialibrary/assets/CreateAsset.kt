package expo.modules.medialibrary.assets

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import expo.modules.core.utilities.ifNull
import expo.modules.medialibrary.AssetException
import expo.modules.medialibrary.AssetFileException
import expo.modules.medialibrary.ContentEntryException
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.UnableToLoadPermissionException
import expo.modules.medialibrary.UnableToSaveException
import expo.modules.medialibrary.albums.getAlbumFileOrNull
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import kotlin.coroutines.coroutineContext

/**
 * Creates an asset entry in the provided albumFile.
 * If no file has been provided the asset will be created in the default directory for the mimeType
 * of the file under the `uri` parameter.
 */
class CreateAssetWithAlbumFile(
  private val context: Context,
  uri: String,
  private val resolveWithAdditionalData: Boolean = true,
  private val albumFile: File?
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
    var path = albumFile?.relativeTo(Environment.getExternalStorageDirectory())?.path
      ?: MediaLibraryUtils.getRelativePathForAssetType(mimeType, true)

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
  private suspend fun writeFileContentsToAsset(localFile: File, assetUri: Uri) = withContext(Dispatchers.IO) {
    val contentResolver = context.contentResolver

    coroutineContext.ensureActive()
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
  private suspend fun createAssetUsingContentResolver(): ArrayList<Bundle>? = withContext(Dispatchers.IO) {
    val assetUri = createContentResolverAssetEntry().ifNull {
      throw ContentEntryException()
    }
    writeFileContentsToAsset(File(mUri.path!!), assetUri)
    coroutineContext.ensureActive()

    if (resolveWithAdditionalData) {
      val selection = "${MediaStore.MediaColumns._ID}=?"
      val args = arrayOf(ContentUris.parseId(assetUri).toString())
      return@withContext queryAssetInfo(context, selection, args, false)
    } else {
      return@withContext null
    }
  }

  /**
   * Creates asset using filesystem. Legacy method - do not use above API 29
   */
  @Throws(IOException::class)
  private fun createAssetFileLegacy(albumFile: File? = null): File {
    val localFile = File(mUri.path!!)
    val mimeType = MediaLibraryUtils.getMimeType(context.contentResolver, mUri).ifNull {
      throw AssetFileException("Could not guess file type.")
    }
    var destDir = albumFile ?: MediaLibraryUtils.getEnvDirectoryForAssetType(mimeType, true)
    val destFile = MediaLibraryUtils.safeCopyFile(localFile, destDir)

    if (!destDir.exists() || !destFile.isFile) {
      throw AssetFileException("Could not create asset record. Related file does not exist.")
    }
    return destFile
  }

  suspend fun execute(): ArrayList<Bundle>? {
    if (!isFileExtensionPresent) {
      throw AssetFileException("Could not get the file's extension.")
    }
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        return createAssetUsingContentResolver()
      }
      val asset = createAssetFileLegacy(albumFile)
      coroutineContext.ensureActive()

      val (path, uri) = MediaLibraryUtils.scanFile(context, arrayOf(asset.path), null)
      coroutineContext.ensureActive()

      if (uri == null) {
        throw AssetException()
      }
      if (resolveWithAdditionalData) {
        val selection = MediaStore.Images.Media.DATA + "=?"
        val args = arrayOf(path)
        return queryAssetInfo(context, selection, args, false)
      }
      return null
    } catch (e: IOException) {
      throw IOException("Unable to copy file into external storage.", e)
    } catch (e: SecurityException) {
      throw UnableToLoadPermissionException("Could not get asset: need READ_EXTERNAL_STORAGE permission", e)
    } catch (e: Exception) {
      throw UnableToSaveException("Could not create asset: ${e.message}", e)
    }
  }
}

suspend fun createAssetWithAlbumId(
  context: Context,
  uri: String,
  resolveWithAdditionalData: Boolean = true,
  albumId: String? = null
): ArrayList<Bundle>? {
  val album = albumId?.let { getAlbumFileOrNull(context, albumId) }
  return CreateAssetWithAlbumFile(context, uri, resolveWithAdditionalData, album).execute()
}
