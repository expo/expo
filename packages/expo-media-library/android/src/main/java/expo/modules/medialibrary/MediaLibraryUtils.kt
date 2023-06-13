package expo.modules.medialibrary

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.text.TextUtils
import android.util.Log
import android.webkit.MimeTypeMap
import expo.modules.kotlin.Promise
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

object MediaLibraryUtils {
  class AssetFile(pathname: String, val assetId: String, val mimeType: String) : File(pathname)

  /**
   * Splits given filename into two-element tuple: name, extension
   *
   * Example:
   * ```
   * getFileNameAndExtension("foo.jpg") // returns arrayOf("foo", "jpg")
   * getFileNameAndExtension("bar") // returns arrayOf("bar", "")
   * ```
   *
   * @return Pair of strings: first is filename, second is extension
   */
  fun getFileNameAndExtension(name: String): Pair<String, String> {
    val dotIdx = name.lastIndexOf(".").takeIf { it != -1 } ?: name.length
    val extension = name.substring(startIndex = dotIdx)
    val filename = name.substring(0, dotIdx)
    return Pair(filename, extension)
  }

  /**
   * Moves the [src] file into [destDir] directory. Ensures that destination is NOT overwritten.
   * If the filename already exists at destination, a suffix is added to the copied filename.
   */
  @Throws(IOException::class)
  fun safeMoveFile(src: File, destDir: File): File =
    safeCopyFile(src, destDir).also { src.delete() }

  /**
   * Copies the [src] file into [destDir] directory. Ensures that destination is NOT overwritten.
   * If the filename already exists at destination, a suffix is added to the copied filename.
   */
  @Throws(IOException::class)
  fun safeCopyFile(src: File, destDir: File): File {
    var newFile = File(destDir, src.name)
    var suffix = 0
    val (filename, extension) = getFileNameAndExtension(src.name)
    val suffixLimit = Short.MAX_VALUE.toInt()
    while (newFile.exists()) {
      newFile = File(destDir, filename + "_" + suffix + extension)
      suffix++
      if (suffix > suffixLimit) {
        throw IOException("File name suffix limit reached ($suffixLimit)")
      }
    }
    FileInputStream(src).channel.use { input ->
      FileOutputStream(newFile).channel.use { output ->
        val transferred = input.transferTo(0, input.size(), output)
        if (transferred != input.size()) {
          newFile.delete()
          throw IOException("Could not save file to $destDir Not enough space.")
        }
        return newFile
      }
    }
  }

  fun deleteAssets(context: Context, selection: String?, selectionArgs: Array<out String?>?, promise: Promise) {
    val projection = arrayOf(MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DATA)
    try {
      context.contentResolver.query(
        EXTERNAL_CONTENT_URI,
        projection,
        selection,
        selectionArgs,
        null
      ).use { filesToDelete ->
        if (filesToDelete == null) {
          throw AssetFileException("Could not delete assets. Cursor is null.")
        } else {
          while (filesToDelete.moveToNext()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
              val columnId = filesToDelete.getColumnIndex(MediaStore.MediaColumns._ID)
              val id = filesToDelete.getLong(columnId)
              val assetUri = ContentUris.withAppendedId(EXTERNAL_CONTENT_URI, id)
              context.contentResolver.delete(assetUri, null)
            } else {
              val dataColumnIndex = filesToDelete.getColumnIndex(MediaStore.MediaColumns.DATA)
              val filePath = filesToDelete.getString(dataColumnIndex)
              val file = File(filePath)
              if (file.delete()) {
                context.contentResolver.delete(
                  EXTERNAL_CONTENT_URI,
                  "${MediaStore.MediaColumns.DATA}=?", arrayOf(filePath)
                )
              } else {
                throw AssetFileException("Could not delete file.")
              }
            }
          }
          promise.resolve(true)
        }
      }
    } catch (e: SecurityException) {
      promise.reject(
        ERROR_UNABLE_TO_SAVE_PERMISSION,
        "Could not delete asset: need WRITE_EXTERNAL_STORAGE permission.", e
      )
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject(ERROR_UNABLE_TO_DELETE, "Could not delete file.", e)
    }
  }

  /**
   * Creates placeholders for parametrized query. Usable inside `IN` clause.
   * Example:
   * ```
   * queryPlaceholdersFor(arrayOf("John, 24")) // returns "?,?"
   * ```
   */
  fun queryPlaceholdersFor(assetIds: Array<out String?>): String =
    arrayOfNulls<String>(assetIds.size)
      .apply { fill("?") }
      .joinToString(separator = ",")

  // Used in albums and migrations only - consider moving it there
  fun getAssetsById(context: Context, vararg assetsId: String?): List<AssetFile> {

    val path = arrayOf(
      MediaStore.MediaColumns._ID,
      MediaStore.MediaColumns.DATA,
      MediaStore.MediaColumns.BUCKET_ID,
      MediaStore.MediaColumns.MIME_TYPE
    )
    val selection = MediaStore.Images.Media._ID + " IN ( " + queryPlaceholdersFor(assetsId) + " )"
    context.contentResolver.query(
      EXTERNAL_CONTENT_URI,
      path,
      selection,
      assetsId,
      null
    ).use { assets ->
      if (assets == null) {
        throw AssetFileException("Could not get assets. Query returns null.")
      } else if (assets.count != assetsId.size) {
        throw AssetFileException("Could not get all of the requested assets")
      }
      val assetFiles = mutableListOf<AssetFile>()
      while (assets.moveToNext()) {
        val data = assets.getColumnIndex(MediaStore.Images.Media.DATA)
        val assetPath = assets.getString(data)
        val id = assets.getColumnIndex(MediaStore.MediaColumns._ID)
        val mimeType = assets.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE)
        val asset = AssetFile(
          assetPath,
          assets.getString(id),
          assets.getString(mimeType)
        )
        if (!asset.exists() || !asset.isFile) {
          throw AssetFileException("Path $assetPath does not exist or isn't file.")
        }
        assetFiles.add(asset)
      }
      return assetFiles
    }
  }

  private fun getMimeTypeFromFileUrl(url: String): String? {
    val extension = MimeTypeMap.getFileExtensionFromUrl(url) ?: return null
    return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
  }

  fun getMimeType(contentResolver: ContentResolver, uri: Uri): String? =
    contentResolver.getType(uri) ?: getMimeTypeFromFileUrl(uri.toString())

  fun getAssetsUris(context: Context, assetsId: List<String?>?): List<Uri> {
    val result = mutableListOf<Uri>()
    val selection = MediaStore.MediaColumns._ID + " IN (" + TextUtils.join(",", assetsId!!) + " )"
    val selectionArgs: Array<String>? = null
    val projection = arrayOf(MediaStore.MediaColumns._ID, MediaStore.MediaColumns.MIME_TYPE)
    context.contentResolver.query(
      EXTERNAL_CONTENT_URI,
      projection,
      selection,
      selectionArgs,
      null
    )?.use { cursor ->
      while (cursor.moveToNext()) {
        val columnId = cursor.getColumnIndex(MediaStore.MediaColumns._ID)
        val columnMimeType = cursor.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE)
        val id = cursor.getLong(columnId)
        val mimeType = cursor.getString(columnMimeType)
        val assetUri = ContentUris.withAppendedId(mimeTypeToExternalUri(mimeType), id)
        result.add(assetUri)
      }
    }
    return result
  }

  fun mimeTypeToExternalUri(mimeType: String?): Uri = when {
    mimeType == null -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
    mimeType.contains("image") -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
    mimeType.contains("video") -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
    mimeType.contains("audio") -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    // For backward compatibility
    else -> EXTERNAL_CONTENT_URI
  }

  fun getRelativePathForAssetType(mimeType: String?, useCameraDir: Boolean): String {
    if (mimeType?.contains("image") == true || mimeType?.contains("video") == true) {
      return if (useCameraDir) Environment.DIRECTORY_DCIM else Environment.DIRECTORY_PICTURES
    } else if (mimeType?.contains("audio") == true) {
      return Environment.DIRECTORY_MUSIC
    }

    // For backward compatibility
    return if (useCameraDir) Environment.DIRECTORY_DCIM else Environment.DIRECTORY_PICTURES
  }

  @Deprecated("It uses deprecated Android method under the hood. See implementation for details.")
  fun getEnvDirectoryForAssetType(mimeType: String?, useCameraDir: Boolean): File =
    Environment.getExternalStoragePublicDirectory(getRelativePathForAssetType(mimeType, useCameraDir))

  private fun getManifestPermissions(context: Context): Set<String> {
    val pm: PackageManager = context.packageManager
    return try {
      val packageInfo = pm.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)
      packageInfo.requestedPermissions?.toSet() ?: emptySet()
    } catch (e: PackageManager.NameNotFoundException) {
      Log.e("expo-media-library", "Failed to list AndroidManifest.xml permissions")
      e.printStackTrace()
      emptySet()
    }
  }

  /**
   * Checks, whenever an application represented by [context] contains specific [permission]
   * in `AndroidManifest.xml`:
   *
   * ```xml
   *  <uses-permission android:name="<<PERMISSION STRING HERE>>" />
   *  ```
   */
  fun hasManifestPermission(context: Context, permission: String): Boolean =
    getManifestPermissions(context).contains(permission)
}
