package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.net.Uri
import android.provider.MediaStore

val EXTERNAL_CONTENT_URI: Uri = MediaStore.Files.getContentUri("external")

fun ContentResolver.queryAlbumName(albumId: Long): String? {
  val projection = arrayOf(MediaStore.Images.Media.BUCKET_DISPLAY_NAME)
  val selection = "${MediaStore.Images.Media.BUCKET_ID} = ?"
  val selectionArgs = arrayOf(albumId.toString())

  return query(
    EXTERNAL_CONTENT_URI,
    projection,
    selection,
    selectionArgs,
    null
  )?.use { cursor ->
    if (cursor.moveToFirst()) {
      val bucketName = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.BUCKET_DISPLAY_NAME))
      return@use bucketName
    } else {
      return@use null
    }
  }
}

fun ContentResolver.queryAlbumAssetsIds(albumId: Long): List<Long> {
  val assetIds = mutableListOf<Long>()
  val projection = arrayOf(MediaStore.Files.FileColumns._ID)
  val selection = "${MediaStore.Files.FileColumns.BUCKET_ID} = ?"
  query(
    EXTERNAL_CONTENT_URI,
    projection,
    selection,
    arrayOf(albumId.toString()),
    null
  )?.use { cursor ->
    val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
    while (cursor.moveToNext()) {
      val assetId = cursor.getLong(idColumn)
      assetIds.add(assetId)
    }
  }
  return assetIds
}

fun ContentResolver.queryAlbumRelativePath(albumId: Long): String? {
  val projection = arrayOf(MediaStore.Files.FileColumns.RELATIVE_PATH)
  val selection = "${MediaStore.Files.FileColumns.BUCKET_ID} = ?"
  val selectionArgs = arrayOf(albumId.toString())

  query(MediaStore.Files.getContentUri("external"), projection, selection, selectionArgs, null)?.use { cursor ->
    if (cursor.moveToFirst()) {
      return cursor.getString(
        cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.RELATIVE_PATH)
      )
    }
  }
  return null
}

fun ContentResolver.queryAlbumId(relativePath: String): Long? {
  val projection = arrayOf(MediaStore.Files.FileColumns.BUCKET_ID)
  val selection = "${MediaStore.Files.FileColumns.RELATIVE_PATH} = ?"
  val selectionArgs = arrayOf(relativePath)

  query(
    EXTERNAL_CONTENT_URI,
    projection,
    selection,
    selectionArgs,
    null
  )?.use { cursor ->
    if (cursor.moveToFirst()) {
      return cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.BUCKET_ID))
    }
  }
  return null
}
