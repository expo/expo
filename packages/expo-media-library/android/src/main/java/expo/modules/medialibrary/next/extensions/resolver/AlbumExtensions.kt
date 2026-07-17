package expo.modules.medialibrary.next.extensions.resolver

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.MediaStore
import expo.modules.medialibrary.next.extensions.asIterable
import expo.modules.medialibrary.next.extensions.asSequence
import expo.modules.medialibrary.next.extensions.getNullableString
import expo.modules.medialibrary.next.objects.wrappers.RelativePath
import expo.modules.medialibrary.next.records.AlbumMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

val EXTERNAL_CONTENT_URI: Uri = MediaStore.Files.getContentUri("external")

suspend fun ContentResolver.queryAlbumTitle(bucketId: String): String? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.MediaColumns.BUCKET_DISPLAY_NAME,
    Cursor::getNullableString,
    "${MediaStore.MediaColumns.BUCKET_ID} = ?",
    arrayOf(bucketId)
  )

suspend fun ContentResolver.queryAlbumRelativePath(bucketId: String): RelativePath? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.MediaColumns.RELATIVE_PATH,
    { index -> getNullableString(index)?.let { RelativePath(it) } },
    "${MediaStore.MediaColumns.BUCKET_ID} = ?",
    arrayOf(bucketId)
  )

suspend fun ContentResolver.queryAlbumFilepath(bucketId: String): String? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.MediaColumns.DATA,
    Cursor::getNullableString,
    "${MediaStore.Files.FileColumns.BUCKET_ID} = ?",
    arrayOf(bucketId)
  )

suspend fun ContentResolver.queryAlbumId(relativePath: RelativePath): String? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.Files.FileColumns.BUCKET_ID,
    Cursor::getNullableString,
    "${MediaStore.Files.FileColumns.RELATIVE_PATH} = ?",
    arrayOf(relativePath.value)
  )

suspend fun ContentResolver.queryAlbumId(name: String): String? =
  queryOne(
    EXTERNAL_CONTENT_URI,
    MediaStore.Files.FileColumns.BUCKET_ID,
    Cursor::getNullableString,
    "${MediaStore.MediaColumns.BUCKET_DISPLAY_NAME} = ?",
    arrayOf(name)
  )

suspend fun ContentResolver.queryAllAlbumIds(): List<String> =
  withContext(Dispatchers.IO) {
    val projection = arrayOf(MediaStore.Files.FileColumns.BUCKET_ID)

    query(EXTERNAL_CONTENT_URI, projection, null, null, null)?.use { cursor ->
      ensureActive()
      val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.BUCKET_ID)
      cursor
        .asIterable()
        .mapNotNull { it.getNullableString(idColumn) }
        .toSet()
        .toList()
    } ?: emptyList()
  }

suspend fun ContentResolver.queryAlbumsMetadata(): List<AlbumMetadata> =
  withContext(Dispatchers.IO) {
    val projection = arrayOf(
      MediaStore.Files.FileColumns.BUCKET_ID,
      MediaStore.MediaColumns.BUCKET_DISPLAY_NAME
    )

    safeQuery(EXTERNAL_CONTENT_URI, projection)?.use { cursor ->
      ensureActive()
      val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.BUCKET_ID)
      val titleColumn = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.BUCKET_DISPLAY_NAME)
      cursor.asSequence()
        .mapNotNull { row ->
          val id = row.getNullableString(idColumn)
            ?: return@mapNotNull null // in case of malformed row, skip it instead of throwing
          val title = row.getNullableString(titleColumn).orEmpty()
          AlbumMetadata(id = id, title = title)
        }
        .toList()
    } ?: emptyList()
  }

suspend fun ContentResolver.queryAlbumAssetsCount(bucketId: String): Int =
  withContext(Dispatchers.IO) {
    val projection = arrayOf(MediaStore.Files.FileColumns._ID)
    val selection = "${MediaStore.Files.FileColumns.BUCKET_ID} = ?"

    safeQuery(EXTERNAL_CONTENT_URI, projection, selection, arrayOf(bucketId))?.use { cursor ->
      ensureActive()
      cursor.count
    } ?: 0
  }

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
