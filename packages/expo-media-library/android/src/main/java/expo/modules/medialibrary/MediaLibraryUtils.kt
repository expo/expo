package expo.modules.medialibrary

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.text.TextUtils
import android.webkit.MimeTypeMap
import expo.modules.core.Promise
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.util.*

object MediaLibraryUtils {
  class AssetFile(pathname: String, val assetId: String, val mimeType: String) : File(pathname)

  /**
   * Splits given filename into two-element tuple: name, extension
   * Example 1:
   * ```
   * getFileNameAndExtension("foo.jpg") // returns arrayOf("foo", "jpg")
   * getFileNameAndExtension("bar") // returns arrayOf("bar", "")
   * ```
   */
  fun getFileNameAndExtension(name: String): Array<String> {
    val dotIdx = name.lastIndexOf(".").takeIf { it != -1 } ?: name.length
    val extension = name.substring(startIndex = dotIdx)
    val filename = name.substring(0, dotIdx)
    return arrayOf(filename, extension)
  }

  /**
   * Moves the `src` file into `dir` directory. Ensures that destination is NOT overwritten.
   * If the filename already exists at destination, a suffix is added to the copied filename.
   */
  @Throws(IOException::class)
  fun safeMoveFile(src: File, dir: File): File {
    val copy = safeCopyFile(src, dir)
    src.delete()
    return copy
  }

  /**
   * Copies the `src` file into `dir` directory. Ensures that destination is NOT overwritten.
   * If the filename already exists at destination, a suffix is added to the copied filename.
   */
  @Throws(IOException::class)
  fun safeCopyFile(src: File, dir: File): File {
    var newFile = File(dir, src.name)
    var suffix = 0
    val origName = getFileNameAndExtension(src.name)
    val suffixLimit = Short.MAX_VALUE.toInt()
    while (newFile.exists()) {
      newFile = File(dir, origName[0] + "_" + suffix + origName[1])
      suffix++
      if (suffix > suffixLimit) {
        throw IOException("File name suffix limit reached ($suffixLimit)")
      }
    }
    FileInputStream(src).channel.use { `in` ->
      FileOutputStream(newFile).channel.use { out ->
        val transferred = `in`.transferTo(0, `in`.size(), out)
        if (transferred != `in`.size()) {
          newFile.delete()
          throw IOException("Could not save file to $dir Not enough space.")
        }
        return newFile
      }
    }
  }

  fun deleteAssets(context: Context, selection: String?, selectionArgs: Array<String?>?, promise: Promise) {
    val projection = arrayOf(MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DATA)
    try {
      context.contentResolver.query(
        MediaLibraryConstants.EXTERNAL_CONTENT,
        projection,
        selection,
        selectionArgs,
        null
      ).use { filesToDelete ->
        if (filesToDelete == null) {
          promise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD, "Could not delete assets. Cursor is null.")
        } else {
          while (filesToDelete.moveToNext()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
              val id = filesToDelete.getLong(filesToDelete.getColumnIndex(MediaStore.MediaColumns._ID))
              val assetUri = ContentUris.withAppendedId(MediaLibraryConstants.EXTERNAL_CONTENT, id)
              context.contentResolver.delete(assetUri, null)
            } else {
              val dataColumnIndex = filesToDelete.getColumnIndex(MediaStore.MediaColumns.DATA)
              val filePath = filesToDelete.getString(dataColumnIndex)
              val file = File(filePath)
              if (file.delete()) {
                context.contentResolver.delete(
                  MediaLibraryConstants.EXTERNAL_CONTENT,
                  "${MediaStore.MediaColumns.DATA}=?", arrayOf(filePath)
                )
              } else {
                promise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_DELETE, "Could not delete file.")
                return
              }
            }
          }
          promise.resolve(true)
        }
      }
    } catch (e: SecurityException) {
      promise.reject(
        MediaLibraryConstants.ERROR_UNABLE_TO_SAVE_PERMISSION,
        "Could not delete asset: need WRITE_EXTERNAL_STORAGE permission.", e
      )
    } catch (e: Exception) {
      e.printStackTrace()
      promise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_DELETE, "Could not delete file.", e)
    }
  }

  /**
   * Creates placeholders for parametrized query. Usable inside `IN` clause.
   * Example:
   * ```
   * queryPlaceholdersFor(arrayOf("John, 24")) // returns "?,?"
   * ```
   */
  fun queryPlaceholdersFor(assetIds: Array<out String?>): String {
    return arrayOfNulls<String>(assetIds.size)
      .apply { fill("?") }
      .joinToString(separator = ",")
  }

  // Used in albums and migrations only - consider moving it there
  fun getAssetsById(context: Context, promise: Promise?, vararg assetsId: String?): List<AssetFile>? {
    val maybePromise = promise.ifNull {
      object : Promise {
        override fun resolve(value: Any) {}
        override fun reject(code: String, message: String, e: Throwable) {}
      }
    }

    val path = arrayOf(MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DATA, MediaStore.MediaColumns.BUCKET_ID, MediaStore.MediaColumns.MIME_TYPE)
    val selection = MediaStore.Images.Media._ID + " IN ( " + queryPlaceholdersFor(assetsId) + " )"
    context.contentResolver.query(
      MediaLibraryConstants.EXTERNAL_CONTENT,
      path,
      selection,
      assetsId,
      null
    ).use { assets ->
      if (assets == null) {
        maybePromise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD, "Could not get assets. Query returns null.")
        return null
      } else if (assets.count != assetsId.size) {
        maybePromise.reject(MediaLibraryConstants.ERROR_NO_ASSET, "Could not get all of the requested assets")
        return null
      }
      val assetFiles: MutableList<AssetFile> = ArrayList()
      while (assets.moveToNext()) {
        val assetPath = assets.getString(assets.getColumnIndex(MediaStore.Images.Media.DATA))
        val asset = AssetFile(
          assetPath,
          assets.getString(assets.getColumnIndex(MediaStore.MediaColumns._ID)),
          assets.getString(assets.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE))
        )
        if (!asset.exists() || !asset.isFile) {
          maybePromise.reject(MediaLibraryConstants.ERROR_UNABLE_TO_LOAD, "Path $assetPath does not exist or isn't file.")
          return null
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

  fun getMimeType(contentResolver: ContentResolver, uri: Uri): String? {
    return contentResolver.getType(uri)
      ?: return getMimeTypeFromFileUrl(uri.toString())
  }

  fun getAssetsUris(context: Context, assetsId: List<String?>?): List<Uri> {
    val result: MutableList<Uri> = ArrayList()
    val selection = MediaStore.MediaColumns._ID + " IN (" + TextUtils.join(",", assetsId!!) + " )"
    val selectionArgs: Array<String>? = null
    val projection = arrayOf(MediaStore.MediaColumns._ID, MediaStore.MediaColumns.MIME_TYPE)
    context.contentResolver.query(
      MediaLibraryConstants.EXTERNAL_CONTENT,
      projection,
      selection,
      selectionArgs,
      null
    ).use { cursor ->
      if (cursor == null) {
        return result
      }
      while (cursor.moveToNext()) {
        val id = cursor.getLong(cursor.getColumnIndex(MediaStore.MediaColumns._ID))
        val mineType = cursor.getString(cursor.getColumnIndex(MediaStore.MediaColumns.MIME_TYPE))
        val assetUri = ContentUris.withAppendedId(mimeTypeToExternalUri(mineType), id)
        result.add(assetUri)
      }
    }
    return result
  }

  fun mimeTypeToExternalUri(mimeType: String?): Uri {
    return when {
      mimeType == null -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
      mimeType.contains("image") -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
      mimeType.contains("video") -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      mimeType.contains("audio") -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      // For backward compatibility
      else -> MediaLibraryConstants.EXTERNAL_CONTENT
    }
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
  fun getEnvDirectoryForAssetType(mimeType: String?, useCameraDir: Boolean): File {
    return Environment.getExternalStoragePublicDirectory(getRelativePathForAssetType(mimeType, useCameraDir))
  }
}
