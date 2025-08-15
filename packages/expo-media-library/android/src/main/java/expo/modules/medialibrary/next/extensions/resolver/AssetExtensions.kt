package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.provider.OpenableColumns
import expo.modules.medialibrary.AssetFileException

fun ContentResolver.queryAssetDisplayName(contentUri: Uri): String? {
  val projection = arrayOf(OpenableColumns.DISPLAY_NAME)
  query(contentUri, projection, null, null, null)?.use { cursor ->
    val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
    if (cursor.moveToFirst() && nameIndex != -1) {
      return cursor.getString(nameIndex)
    }
  }
  return null
}

fun ContentResolver.queryAssetLocalUri(uri: Uri): String {
  val projection = arrayOf(MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DATA)
  query(uri, projection, null, null, null).use { cursor ->
    if (cursor == null) {
      throw AssetFileException("Could not delete assets. Cursor is null.")
    }
    if (cursor.moveToFirst()) {
      val dataColumnIndex = cursor.getColumnIndex(MediaStore.MediaColumns.DATA)
      val filePath = cursor.getString(dataColumnIndex)
      return filePath
    } else {
      throw AssetFileException("Could not delete assets. Asset not found.")
    }
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
