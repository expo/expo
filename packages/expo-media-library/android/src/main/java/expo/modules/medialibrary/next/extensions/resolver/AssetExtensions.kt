package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import expo.modules.medialibrary.AssetFileException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

suspend fun ContentResolver.queryAssetDisplayName(contentUri: Uri): String? =
  queryAssetProperty(contentUri, android.provider.OpenableColumns.DISPLAY_NAME) { c, i -> c.getString(i) }

suspend fun ContentResolver.queryGetCreationTime(contentUri: Uri): Long? =
  queryAssetProperty(contentUri, MediaStore.Images.Media.DATE_TAKEN) { c, i -> c.getLong(i) }

suspend fun ContentResolver.queryAssetModificationDate(contentUri: Uri): Long? =
  queryAssetProperty(contentUri, MediaStore.Images.Media.DATE_MODIFIED) { c, i -> c.getLong(i) }

suspend fun ContentResolver.queryAssetDuration(contentUri: Uri): Long? =
  queryAssetProperty(contentUri, MediaStore.Video.VideoColumns.DURATION) { c, i -> c.getLong(i) }

suspend fun ContentResolver.queryAssetMediaType(contentUri: Uri): Int? =
  queryAssetProperty(contentUri, MediaStore.Files.FileColumns.MEDIA_TYPE) { c, i -> c.getInt(i) }

suspend fun ContentResolver.queryAssetWidth(contentUri: Uri): Int? =
  queryAssetProperty(contentUri, MediaStore.Images.Media.WIDTH) { c, i -> c.getInt(i) }

suspend fun ContentResolver.queryAssetHeight(contentUri: Uri): Int? =
  queryAssetProperty(contentUri, MediaStore.Images.Media.HEIGHT) { c, i -> c.getInt(i) }

suspend fun ContentResolver.queryAssetUri(contentUri: Uri): String? =
  queryAssetProperty(contentUri, MediaStore.Images.Media.DATA) { c, i -> c.getString(i) }

private suspend fun <T> ContentResolver.queryAssetProperty(
  contentUri: Uri,
  column: String,
  extractor: (cursor: Cursor, index: Int) -> T?
): T? = withContext(Dispatchers.IO) {
  val projection = arrayOf(column)
  query(contentUri, projection, null, null, null)?.use { cursor ->
    ensureActive()
    val index = cursor.getColumnIndex(column)
    if (cursor.moveToFirst() && index != -1) {
      return@withContext extractor(cursor, index)
    }
  }
  return@withContext null
}

suspend fun ContentResolver.queryAssetLocalUri(uri: Uri): String = withContext(Dispatchers.IO) {
  val projection = arrayOf(MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DATA)
  query(uri, projection, null, null, null).use { cursor ->
    ensureActive()
    if (cursor == null) {
      throw AssetFileException("Could not delete assets. Cursor is null.")
    }
    if (!cursor.moveToFirst()) {
      throw AssetFileException("Could not delete assets. Asset not found.")
    }
    val dataColumnIndex = cursor.getColumnIndex(MediaStore.MediaColumns.DATA)
    val assetLocalUri = cursor.getString(dataColumnIndex)
    return@withContext assetLocalUri
  }
}

fun ContentResolver.insertPendingAsset(
  displayName: String,
  mimeType: String?,
  relativePath: String
): Uri {
  val contentValues = ContentValues().apply {
    put(MediaStore.MediaColumns.DISPLAY_NAME, displayName)
    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
    put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath)
    put(MediaStore.MediaColumns.IS_PENDING, 1)
  }

  val collectionUri = when {
    mimeType == null -> EXTERNAL_CONTENT_URI
    mimeType.startsWith("image/") -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
    mimeType.startsWith("video/") -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
    mimeType.startsWith("audio/") -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    else -> EXTERNAL_CONTENT_URI
  }

  return insert(collectionUri, contentValues) ?: TODO("jakies bledy")
}

fun ContentResolver.publishPendingAsset(uri: Uri) {
  val contentValues = ContentValues().apply {
    put(MediaStore.MediaColumns.IS_PENDING, 0)
  }
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    update(uri, contentValues, null)
  }
}

fun ContentResolver.updateRelativePath(contentUri: Uri, newRelativePath: String) {
  val contentValues = ContentValues().apply {
    put(MediaStore.MediaColumns.RELATIVE_PATH, newRelativePath)
  }
  update(contentUri, contentValues, null, null)
}

fun ContentResolver.getMimeCategory(uri: Uri): String? {
  return this.getType(uri)?.substringBefore("/")
}
