package expo.modules.medialibrary.albums

import android.content.Context
import android.os.Bundle
import android.provider.MediaStore
import android.provider.MediaStore.Files.FileColumns
import android.provider.MediaStore.MediaColumns
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.Promise
import expo.modules.medialibrary.AlbumException
import expo.modules.medialibrary.AssetFileException
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD
import expo.modules.medialibrary.ERROR_UNABLE_TO_LOAD_PERMISSION
import expo.modules.medialibrary.EXTERNAL_CONTENT_URI
import expo.modules.medialibrary.MediaLibraryException
import expo.modules.medialibrary.MediaLibraryUtils
import expo.modules.medialibrary.MediaLibraryUtils.queryPlaceholdersFor
import java.io.File

/**
 * Queries for assets filtered by given `selection`.
 * Resolves `promise` with [Bundle] of kind: `Array<{ id, title, assetCount }>`
 */
fun queryAlbum(
  context: Context,
  selection: String,
  selectionArgs: Array<String>?,
  promise: Promise
) {
  val projection = arrayOf(MediaColumns.BUCKET_ID, MediaColumns.BUCKET_DISPLAY_NAME)
  val order = MediaColumns.BUCKET_DISPLAY_NAME
  try {
    context.contentResolver.query(
      EXTERNAL_CONTENT_URI,
      projection,
      selection,
      selectionArgs,
      order
    ).use { albumsCursor ->
      if (albumsCursor == null) {
        throw AlbumException("Could not get album. Query is incorrect.")
      }
      if (!albumsCursor.moveToNext()) {
        promise.resolve(null)
        return
      }
      val bucketIdIndex = albumsCursor.getColumnIndex(MediaColumns.BUCKET_ID)
      val bucketDisplayNameIndex = albumsCursor.getColumnIndex(MediaColumns.BUCKET_DISPLAY_NAME)
      val result = Bundle().apply {
        putString("id", albumsCursor.getString(bucketIdIndex))
        putString("title", albumsCursor.getString(bucketDisplayNameIndex))
        putInt("assetCount", albumsCursor.count)
      }
      promise.resolve(result)
    }
  } catch (e: SecurityException) {
    promise.reject(
      ERROR_UNABLE_TO_LOAD_PERMISSION,
      "Could not get albums: need READ_EXTERNAL_STORAGE permission.",
      e
    )
  } catch (e: IllegalArgumentException) {
    promise.reject(ERROR_UNABLE_TO_LOAD, "Could not get album.", e)
  }
}

/**
 * Returns flat list of asset IDs (`_ID` column) for given album IDs (`BUCKET_ID` column)
 */
fun getAssetsInAlbums(context: Context, vararg albumIds: String?): List<String> {
  val assetIds = mutableListOf<String>()
  val selection = "${MediaColumns.BUCKET_ID} IN (${queryPlaceholdersFor(albumIds)} )"
  val projection = arrayOf(MediaColumns._ID)
  context.contentResolver.query(
    EXTERNAL_CONTENT_URI,
    projection,
    selection,
    albumIds,
    null
  ).use { assetCursor ->
    if (assetCursor == null) {
      return assetIds
    }
    while (assetCursor.moveToNext()) {
      val columnId = assetCursor.getColumnIndex(MediaStore.Images.Media._ID)
      val id = assetCursor.getString(columnId)
      assetIds.add(id)
    }
  }
  return assetIds
}

internal fun getFileOrNullByContextResolver(context: Context, selection: String, selectionArgs: Array<String>): File? {
  context.contentResolver.query(
    EXTERNAL_CONTENT_URI,
    arrayOf(MediaColumns.DATA),
    selection,
    selectionArgs,
    null
  ).use { fileCursor ->
    if (fileCursor == null) {
      throw AlbumException("Could not get album. Query returns null.")
    } else if (fileCursor.count == 0) {
      return null
    }
    fileCursor.moveToNext()
    val filePathColumnIndex = fileCursor.getColumnIndex(MediaStore.Images.Media.DATA)
    val fileInAlbum = File(fileCursor.getString(filePathColumnIndex))

    // Media store table can be corrupted. Extra check won't harm anyone.
    if (!fileInAlbum.isFile && !fileInAlbum.isDirectory) {
      throw MediaLibraryException()
    }
    return File(fileInAlbum.parent!!)
  }
}

internal fun getAlbumFileByNameOrNull(context: Context, albumName: String): File? {
  val selection = "${FileColumns.MEDIA_TYPE} != ${FileColumns.MEDIA_TYPE_NONE} AND ${MediaColumns.BUCKET_DISPLAY_NAME}=?"
  val selectionArgs = arrayOf(albumName)

  return getFileOrNullByContextResolver(context, selection, selectionArgs)
}

internal fun getAlbumFileOrNull(context: Context, albumId: String): File? {
  val selection = "${MediaColumns.BUCKET_ID}=?"
  val selectionArgs = arrayOf(albumId)

  return getFileOrNullByContextResolver(context, selection, selectionArgs)
}

internal fun getAlbumFile(context: Context, albumId: String): File {
  val albumFile = getAlbumFileOrNull(context, albumId)
  return albumFile ?: throw AlbumException("Could not get album. Query returns null.")
}

internal fun createAlbumFile(mimeType: String, albumName: String): File {
  val albumDir = MediaLibraryUtils.getEnvDirectoryForAssetType(mimeType, false)
    .ifNull {
      throw AssetFileException("Could not guess asset type.")
    }

  val album = File(albumDir.path, albumName)
    .takeIf { it.exists() || it.mkdirs() }
    .ifNull {
      throw AlbumException("Could not create album directory.")
    }
  return album
}
