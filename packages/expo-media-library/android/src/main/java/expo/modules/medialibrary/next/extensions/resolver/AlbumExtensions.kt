package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.MediaStore
import expo.modules.medialibrary.next.extensions.asIterable
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

val EXTERNAL_CONTENT_URI: Uri = MediaStore.Files.getContentUri("external")

suspend fun ContentResolver.queryAlbumTitle(bucketId: String): String? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.MediaColumns.BUCKET_DISPLAY_NAME,
    Cursor::getString,
    "${MediaStore.MediaColumns.BUCKET_ID} = ?",
    arrayOf(bucketId)
  )

suspend fun ContentResolver.queryAlbumRelativePath(bucketId: String): RelativePath? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.MediaColumns.RELATIVE_PATH,
    { index -> RelativePath(getString(index)) },
    "${MediaStore.MediaColumns.BUCKET_ID} = ?",
    arrayOf(bucketId)
  )

suspend fun ContentResolver.queryAlbumFilepath(bucketId: String): String? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.MediaColumns.DATA,
    Cursor::getString,
    "${MediaStore.Files.FileColumns.BUCKET_ID} = ?",
    arrayOf(bucketId)
  )

suspend fun ContentResolver.queryAlbumId(relativePath: RelativePath): String? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.Files.FileColumns.BUCKET_ID,
    Cursor::getString,
    "${MediaStore.Files.FileColumns.RELATIVE_PATH} = ?",
    arrayOf(relativePath.value)
  )

suspend fun ContentResolver.queryAlbumAssetsContentUris(bucketId: String): List<Uri> =
  withContext(Dispatchers.IO) {
    val projection = arrayOf(
      MediaStore.Files.FileColumns._ID,
      MediaStore.Files.FileColumns.MEDIA_TYPE
    )
    val selection = "${MediaStore.Files.FileColumns.BUCKET_ID} = ?"

    query(EXTERNAL_CONTENT_URI, projection, selection, arrayOf(bucketId), null)?.use { cursor ->
      ensureActive()
      val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
      val typeColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
      cursor
        .asIterable()
        .map { it.extractAssetContentUri(idColumn, typeColumn) }
        .toList()
    } ?: emptyList()
  }
